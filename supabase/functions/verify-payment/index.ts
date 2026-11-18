import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpaySecret) {
      return Response.json(
        { error: 'RAZORPAY_KEY_SECRET is not configured.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData } = await supabase.auth.getUser(jwt);
    if (!userData.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json({ error: 'Missing payment verification fields' }, { status: 400, headers: corsHeaders });
    }

    const expectedSig = await hmacSha256Hex(
      razorpaySecret,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );

    if (expectedSig !== razorpay_signature) {
      return Response.json({ error: 'Invalid payment signature' }, { status: 400, headers: corsHeaders });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id,
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (orderErr || !order) {
      return Response.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
    }

    await supabase.from('order_events').insert({
      order_id: order.id,
      status: 'paid',
      note: 'Payment signature verified via Razorpay',
    });

    await supabase
      .from('carts')
      .update({ status: 'converted' })
      .eq('user_id', userData.user.id)
      .eq('status', 'active');

    return Response.json({ ok: true, orderId: order.id, orderCode: order.order_code }, { headers: corsHeaders });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500, headers: corsHeaders }
    );
  }
});
