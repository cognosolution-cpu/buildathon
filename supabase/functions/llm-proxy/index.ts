import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const userWindowMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userWindowMap.get(userId);
  if (!entry || entry.resetAt < now) {
    userWindowMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count += 1;
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

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

    if (!checkRateLimit(userData.user.id)) {
      return Response.json({ error: 'Rate limit exceeded (20 calls/min)' }, { status: 429, headers: corsHeaders });
    }

    const { transcript, context } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return Response.json({ error: 'Missing transcript' }, { status: 400, headers: corsHeaders });
    }

    const systemPrompt = `You are the NLU intent parser for VoicoCart (voice-first Indian electronics & gear storefront).
Return ONLY valid JSON with this exact shape:
{
  "intent": "SEARCH_PRODUCTS" | "RECOMMEND" | "ASK_PRODUCT" | "ADD_TO_CART" | "REMOVE_FROM_CART" | "UPDATE_QUANTITY" | "COMPARE" | "SHOW_CART" | "CHECKOUT" | "CONFIRM" | "DENY" | "TRACK_ORDER" | "RETURN_ITEM" | "CHANGE_LANGUAGE" | "HELP" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "entities": {
    "query": string optional,
    "category": "audio" | "wearables" | "smart-home" | "footwear" | "peripherals" | "cameras" | "eyewear" | "accessories" | "gaming" | "workspace" | "fitness" | "travel" optional,
    "maxPrice": number optional,
    "minPrice": number optional,
    "color": string optional,
    "productRef": { "index": number, "id": string, "name": string, "this": boolean } optional,
    "productRefs": array of productRef optional,
    "quantity": number optional,
    "variant": string optional,
    "question": string optional,
    "occasion": string optional,
    "reason": string optional,
    "simpleView": boolean optional,
    "lang": "en-IN" | "hi-IN" | "kn-IN" | "ta-IN" | "te-IN" optional
  },
  "reply_hint": short natural reply sentence in user's language (optional)
}
If user asks to "show full product in 3d view" or "open <product> in 3D", return ASK_PRODUCT with entities.simpleView=false and productRef.
Context: screen=${context?.screen ?? 'home'}, visibleProducts=${JSON.stringify(context?.visibleProducts ?? [])}, cartCount=${context?.cartCount ?? 0}, lang=${context?.lang ?? 'en-IN'}.`;

    if (geminiApiKey) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: transcript }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      const payload = await geminiRes.json();
      const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return Response.json(JSON.parse(rawText), { headers: corsHeaders });
      }
    }

    if (groqApiKey) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
        }),
      });
      const payload = await groqRes.json();
      const rawText = payload?.choices?.[0]?.message?.content;
      if (rawText) {
        return Response.json(JSON.parse(rawText), { headers: corsHeaders });
      }
    }

    return Response.json(
      { intent: 'UNKNOWN', confidence: 0, entities: {} },
      { status: 503, headers: corsHeaders }
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'NLU proxy error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
