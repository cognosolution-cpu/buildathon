import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpaySecret) {
      return Response.json(
        { error: 'Razorpay secrets are not configured in Supabase Edge Function secrets.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return Response.json({ error: 'Unauthorized user' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const address = body?.address;
    if (!address || !address.name || !address.line1 || !address.pincode) {
      return Response.json({ error: 'Invalid delivery address' }, { status: 400, headers: corsHeaders });
    }

    // Recompute totals strictly server-side from active cart in Postgres
    const { data: cart, error: cartErr } = await supabase
      .from('carts')
      .select('id, cart_items(quantity, variant_name, products(id, slug, title, price, image_url))')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartErr || !cart || !Array.isArray(cart.cart_items) || cart.cart_items.length === 0) {
      return Response.json({ error: 'Your cart is empty' }, { status: 400, headers: corsHeaders });
    }

    const items = cart.cart_items as Array<{
      quantity: number;
      variant_name: string;
      products: { id: string; slug: string; title: string; price: number; image_url: string };
    }>;

    const subtotal = items.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal > 999 ? 0 : 49;
    const total = subtotal + shipping;
    const amountPaise = Math.round(total * 100);

    // Create Razorpay order using Basic Auth
    const basicAuth = btoa(`${razorpayKeyId}:${razorpaySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `vc_${Date.now()}`,
      }),
    });

    const rzpOrder = await rzpRes.json();
    if (!rzpRes.ok || !rzpOrder?.id) {
      return Response.json(
        { error: rzpOrder?.error?.description ?? 'Razorpay order creation failed' },
        { status: 502, headers: corsHeaders }
      );
    }

    // Insert pending order & snapshot items in Postgres
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        address,
        subtotal,
        shipping,
        total,
        status: 'created',
        razorpay_order_id: rzpOrder.id,
      })
      .select()
      .single();

    if (orderErr || !order) {
      return Response.json({ error: 'Failed to create order record' }, { status: 500, headers: corsHeaders });
    }

    await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.products.id,
        product_slug: item.products.slug,
        title: item.products.title,
        price: Number(item.products.price),
        quantity: item.quantity,
        variant_name: item.variant_name,
        image_url: item.products.image_url,
      }))
    );

    return Response.json(
      {
        orderId: order.id,
        orderCode: order.order_code,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        keyId: razorpayKeyId,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
