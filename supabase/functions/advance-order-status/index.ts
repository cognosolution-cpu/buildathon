import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEXT_STATUS: Record<string, { status: string; note: string }> = {
  paid: { status: 'packed', note: 'Quality checked & packed at fulfillment center' },
  packed: { status: 'shipped', note: 'Handed over to express air courier' },
  shipped: { status: 'out_for_delivery', note: 'Out for delivery with local courier partner' },
  out_for_delivery: { status: 'delivered', note: 'Delivered to customer address' },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (cronSecret && token !== cronSecret && token !== serviceRoleKey) {
      return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey);
    const { data: activeOrders, error } = await supabase
      .from('orders')
      .select('id, status')
      .in('status', ['paid', 'packed', 'shipped', 'out_for_delivery'])
      .limit(25);

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    let advanced = 0;
    for (const order of activeOrders ?? []) {
      const next = NEXT_STATUS[order.status];
      if (!next) continue;
      await supabase.from('orders').update({ status: next.status }).eq('id', order.id);
      await supabase.from('order_events').insert({
        order_id: order.id,
        status: next.status,
        note: next.note,
      });
      advanced += 1;
    }

    return Response.json({ ok: true, advanced }, { headers: corsHeaders });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
