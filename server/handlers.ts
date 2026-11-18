import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { CATALOG } from '../src/data/catalog';

export interface HandlerResult {
  status: number;
  data: Record<string, unknown>;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const NLU_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description:
        'One of: SEARCH_PRODUCTS, RECOMMEND, ASK_PRODUCT, ADD_TO_CART, REMOVE_FROM_CART, UPDATE_QUANTITY, COMPARE, SHOW_CART, CHECKOUT, CONFIRM, DENY, TRACK_ORDER, RETURN_ITEM, CHANGE_LANGUAGE, HELP, UNKNOWN',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score between 0 and 1.',
    },
    replyHint: {
      type: Type.STRING,
      description: 'Optional concise friendly reply sentence matching the requested shopping action.',
    },
    entities: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Product search keywords.' },
        category: {
          type: Type.STRING,
          description: 'Optional category slug: audio, wearables, smart-home, footwear, peripherals.',
        },
        maxPrice: { type: Type.NUMBER, description: 'Maximum price in INR.' },
        minPrice: { type: Type.NUMBER, description: 'Minimum price in INR.' },
        color: { type: Type.STRING, description: 'Requested color or finish.' },
        quantity: { type: Type.INTEGER, description: 'Item quantity (1-10).' },
        variant: { type: Type.STRING, description: 'Color/variant name.' },
        question: { type: Type.STRING, description: 'Product spec question.' },
        occasion: { type: Type.STRING, description: 'Recommendation context or occasion.' },
        reason: { type: Type.STRING, description: 'Return reason.' },
        lang: {
          type: Type.STRING,
          description: 'Language code: en-IN, hi-IN, kn-IN, ta-IN, or te-IN.',
        },
        productRef: {
          type: Type.OBJECT,
          properties: {
            index: { type: Type.INTEGER, description: '1-based index of visible product.' },
            id: { type: Type.STRING, description: 'Product id/slug.' },
            name: { type: Type.STRING, description: 'Product title fragment.' },
            this: { type: Type.BOOLEAN, description: 'True if user refers to current item.' },
          },
        },
        productRefs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.INTEGER },
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              this: { type: Type.BOOLEAN },
            },
          },
        },
      },
    },
  },
  required: ['intent', 'confidence', 'entities'],
};

export function handleHealth(): HandlerResult {
  const geminiConfigured = Boolean(getGeminiClient());
  const supabaseConfigured = Boolean(
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
  );
  const razorpayConfigured = Boolean(process.env.VITE_RAZORPAY_KEY_ID);
  const razorpayServerReady = Boolean(
    (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID) &&
      process.env.RAZORPAY_KEY_SECRET
  );
  return {
    status: 200,
    data: {
      ok: true,
      geminiConfigured,
      supabaseConfigured,
      razorpayConfigured,
      razorpayServerReady,
    },
  };
}

export async function handleCreateRazorpayOrder(
  body: Record<string, unknown>
): Promise<HandlerResult> {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    return {
      status: 503,
      data: { error: 'Razorpay server keys are not configured.' },
    };
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return { status: 400, data: { error: 'Cart is empty.' } };
  }

  let subtotal = 0;
  for (const rawItem of items) {
    const item = rawItem as Record<string, unknown>;
    const productId = typeof item?.productId === 'string' ? item.productId : '';
    const qty = Math.max(1, Math.min(10, Math.round(Number(item?.quantity ?? 1))));
    const catalogProduct = CATALOG.find((p) => p.id === productId);
    if (!catalogProduct) {
      return { status: 400, data: { error: `Unknown product: ${productId}` } };
    }
    subtotal += catalogProduct.price * qty;
  }

  const shipping = subtotal === 0 || subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;
  const amountPaise = Math.round(total * 100);

  try {
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
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
    const rpOrder = (await rzpRes.json()) as {
      id?: string;
      amount?: number;
      error?: { description?: string };
    };
    if (!rzpRes.ok || !rpOrder?.id) {
      return {
        status: 502,
        data: { error: rpOrder?.error?.description ?? 'Razorpay order creation failed.' },
      };
    }
    return {
      status: 200,
      data: {
        orderId: `VC-${Math.floor(1100 + Math.random() * 8800)}`,
        razorpayOrderId: rpOrder.id,
        amount: rpOrder.amount,
        keyId,
      },
    };
  } catch (err) {
    return {
      status: 502,
      data: { error: err instanceof Error ? err.message : 'Failed to reach Razorpay API.' },
    };
  }
}

export function handleVerifyRazorpay(body: Record<string, unknown>): HandlerResult {
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keySecret) {
    return { status: 503, data: { error: 'RAZORPAY_KEY_SECRET is not configured.' } };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};
  if (
    typeof razorpay_order_id !== 'string' ||
    typeof razorpay_payment_id !== 'string' ||
    typeof razorpay_signature !== 'string'
  ) {
    return { status: 400, data: { error: 'Missing payment verification fields.' } };
  }

  const expectedHex = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  const actualBuf = Buffer.from(razorpay_signature, 'utf8');
  const valid =
    expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!valid) {
    return { status: 400, data: { error: 'Invalid Razorpay payment signature.' } };
  }

  return { status: 200, data: { ok: true } };
}

export async function handleNlu(body: Record<string, unknown>): Promise<HandlerResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      status: 503,
      data: { error: 'GEMINI_API_KEY is not configured on the server.' },
    };
  }

  const transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : '';
  const context = (body?.context ?? {}) as Record<string, unknown>;

  if (!transcript) {
    return { status: 400, data: { error: 'Transcript is required.' } };
  }

  const systemInstruction = `You are the voice NLU intent router for VibeCart (an Indian dark-mode electronics & gear store).
Map natural, conversational, Hinglish, Hindi, Kannada, Tamil, Telugu, or English shopping requests into a structured intent + entities JSON.
Never invent products or prices; only extract what the user wants or refers to.
Active store categories:
- audio (wireless earbuds, ANC headphones)
- wearables (smartwatch, fitness tracker)
- smart-home (smart speaker)
- footwear (running shoes, sneakers)
- peripherals (mechanical keyboard)
Extraction rules:
- If the user mentions any budget or price cap (e.g. "around 3000", "under 2k", "budget 5000"), always set entities.maxPrice as a number in INR.
- Map activity/occasion words to the best matching category and search query (e.g. "morning jog" -> category="footwear", query="running shoes"; "gaming" -> category="peripherals", query="keyboard"; "gym music" -> category="audio", query="wireless earbuds").
- Only populate entities.reason when intent is RETURN_ITEM.
Context:
- current screen: ${String(context.screen ?? 'home')}
- preferred language: ${String(context.lang ?? 'en-IN')}
- cart count: ${Number(context.cartCount ?? 0)}
- visible numbered products: ${JSON.stringify(context.visibleProducts ?? [])}
Keep replyHint brief (max 18 words) in the user's preferred language or the language they spoke.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: transcript,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: NLU_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    const rawJson = (response.text ?? '').trim();
    if (!rawJson) {
      return { status: 502, data: { error: 'Empty response from Gemini NLU.' } };
    }
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    return { status: 200, data: parsed };
  } catch (err) {
    console.error('[/api/nlu] Gemini error:', err);
    return {
      status: 502,
      data: { error: err instanceof Error ? err.message : 'Failed to parse intent via Gemini.' },
    };
  }
}

type VercelRequest = IncomingMessage & { body?: unknown };

async function readJsonBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return req.body.trim() ? (JSON.parse(req.body) as Record<string, unknown>) : {};
    }
    if (typeof req.body === 'object' && req.body !== null) {
      return req.body as Record<string, unknown>;
    }
    return {};
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

export async function runVercelHandler(
  req: VercelRequest,
  res: ServerResponse,
  method: 'GET' | 'POST',
  fn: (body: Record<string, unknown>) => Promise<HandlerResult> | HandlerResult
): Promise<void> {
  if (req.method !== method) {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `Method ${req.method ?? 'UNKNOWN'} not allowed` }));
    return;
  }

  try {
    const body = method === 'POST' ? await readJsonBody(req) : {};
    const result = await fn(body);
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  } catch (err) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Invalid request payload.',
      })
    );
  }
}
