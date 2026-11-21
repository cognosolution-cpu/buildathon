import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import agoraTokenPkg from 'agora-token';
import { CATALOG } from '../src/data/catalog.js';
import type { LangCode, VoiceGender } from '../src/types.js';
import { resolveMurfVoice } from '../src/voice/murfVoices.js';

const resolvedAgoraPkg =
  (agoraTokenPkg as unknown as { default?: typeof agoraTokenPkg }).default ?? agoraTokenPkg;
const { RtcTokenBuilder, RtcRole } = resolvedAgoraPkg;

export interface HandlerResult {
  status: number;
  data?: Record<string, unknown>;
  binary?: Buffer;
  contentType?: string;
}

function getAgoraCredentials() {
  const appId = (process.env.AGORA_APP_ID || process.env.VITE_AGORA_APP_ID || '').trim();
  const appCert = (process.env.AGORA_APP_CERTIFICATE || '').trim();
  const murfKey = (process.env.MURF_API_KEY || '').trim();
  return { appId, appCert, murfKey };
}

function getGeminiApiKey(): string {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return '';
  return apiKey;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildAgoraRtcToken(appId: string, appCert: string, channelName: string, uid: number, ttlSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const expireAt = now + ttlSeconds;
  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCert,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    expireAt,
    expireAt
  );
}

const NLU_ENTITIES_PROPERTIES = {
  query: { type: Type.STRING, description: 'Product search keywords.' },
  category: {
    type: Type.STRING,
    description:
      'Optional category slug: audio, wearables, smart-home, footwear, peripherals, cameras, eyewear, accessories, gaming, workspace, fitness, travel.',
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
  targetRoute: {
    type: Type.STRING,
    description: 'Target screen route: home, results, product, compare, cart, checkout, orders, profile.',
  },
  checkoutFields: {
    type: Type.OBJECT,
    description: 'Delivery address form fields on checkout page.',
    properties: {
      name: { type: Type.STRING, description: 'Recipient full name.' },
      phone: { type: Type.STRING, description: '10-digit Indian mobile number.' },
      line1: { type: Type.STRING, description: 'Street, flat, building address.' },
      city: { type: Type.STRING, description: 'City name.' },
      state: { type: Type.STRING, description: 'State name.' },
      pincode: { type: Type.STRING, description: '6-digit Indian PIN code.' },
    },
  },
  profileFields: {
    type: Type.OBJECT,
    description: 'Personal info fields for profile screen.',
    properties: {
      fullName: { type: Type.STRING, description: 'User full name.' },
      phone: { type: Type.STRING, description: '10-digit Indian mobile number.' },
    },
  },
  saveAddress: {
    type: Type.BOOLEAN,
    description: 'True when the user wants to save the address permanently to Saved Delivery Addresses.',
  },
  simpleView: {
    type: Type.BOOLEAN,
    description: 'True for 2D studio photos Simple View; false for 3D interactive view.',
  },
  payMethod: { type: Type.STRING, description: 'card or upi.' },
  upiId: { type: Type.STRING, description: 'UPI ID like name@upi.' },
  useSavedAddress: { type: Type.BOOLEAN, description: 'True if user wants saved address applied.' },
  submitPayment: { type: Type.BOOLEAN, description: 'True if user says pay now / submit payment.' },
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
};

const NLU_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description:
        'One of: SEARCH_PRODUCTS, RECOMMEND, ASK_PRODUCT, ADD_TO_CART, REMOVE_FROM_CART, UPDATE_QUANTITY, CLEAR_CART, COMPARE, SHOW_CART, CHECKOUT, FILL_CHECKOUT, SAVE_ADDRESS, UPDATE_PROFILE, TOGGLE_SIMPLE_VIEW, NAVIGATE, SIGN_IN_GOOGLE, CONFIRM, DENY, TRACK_ORDER, RETURN_ITEM, CHANGE_LANGUAGE, HELP, UNKNOWN',
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
      properties: NLU_ENTITIES_PROPERTIES,
    },
    followUpActions: {
      type: Type.ARRAY,
      description: 'Optional additional actions when the user chains multiple requests (e.g. add item AND go to checkout).',
      items: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          entities: { type: Type.OBJECT, properties: NLU_ENTITIES_PROPERTIES },
        },
        required: ['intent', 'entities'],
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
  const { appId, appCert, murfKey } = getAgoraCredentials();
  const agoraConfigured = Boolean(appId && appCert);
  const murfConfigured = Boolean(murfKey);

  return {
    status: 200,
    data: {
      ok: true,
      geminiConfigured,
      supabaseConfigured,
      razorpayConfigured,
      razorpayServerReady,
      agoraConfigured,
      murfConfigured,
    },
  };
}

export function handleAgoraToken(body: Record<string, unknown>): HandlerResult {
  const { appId, appCert } = getAgoraCredentials();
  if (!appId || !appCert) {
    return {
      status: 503,
      data: { error: 'AGORA_APP_ID and AGORA_APP_CERTIFICATE are not configured.' },
    };
  }

  const rawChannel = typeof body?.channelName === 'string' ? body.channelName.trim() : '';
  const channelName =
    rawChannel || `voicocart_${Date.now().toString(36)}_${Math.floor(100 + Math.random() * 899)}`;
  const rawUid = Number(body?.uid);
  const uid =
    Number.isFinite(rawUid) && rawUid > 0
      ? Math.floor(rawUid)
      : Math.floor(10000 + Math.random() * 80000);

  const ttlSeconds = 3600;
  const token = buildAgoraRtcToken(appId, appCert, channelName, uid, ttlSeconds);

  return {
    status: 200,
    data: {
      appId,
      channelName,
      uid,
      token,
      expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
    },
  };
}

export async function handleAgoraStart(body: Record<string, unknown>): Promise<HandlerResult> {
  const { appId, appCert, murfKey } = getAgoraCredentials();
  const geminiKey = getGeminiApiKey();

  if (!appId || !appCert) {
    return {
      status: 503,
      data: { error: 'Agora App ID and App Certificate are not configured on the server.' },
    };
  }
  if (!murfKey) {
    return {
      status: 503,
      data: { error: 'MURF_API_KEY is not configured on the server.' },
    };
  }
  if (!geminiKey) {
    return {
      status: 503,
      data: { error: 'GEMINI_API_KEY is required as the LLM brain for the Agora agent.' },
    };
  }

  const channelName = typeof body?.channelName === 'string' ? body.channelName.trim() : '';
  if (!channelName) {
    return { status: 400, data: { error: 'channelName is required.' } };
  }

  const lang = (typeof body?.lang === 'string' ? body.lang : 'en-IN') as LangCode;
  const rawGender = body?.voiceGender;
  const voiceGender: VoiceGender =
    rawGender === 'cloned' ? 'cloned' : rawGender === 'male' ? 'male' : 'female';
  const voice = resolveMurfVoice(lang, voiceGender);

  const userUid = Number.isFinite(Number(body?.userUid)) ? String(Number(body.userUid)) : '*';
  const agentUid = 999999;
  const restToken = buildAgoraRtcToken(appId, appCert, channelName, 0, 3600);
  const agentToken = buildAgoraRtcToken(appId, appCert, channelName, agentUid, 3600);

  const context = (body?.context ?? {}) as Record<string, unknown>;
  const catalogSummary = CATALOG.map(
    (p, idx) =>
      `${idx + 1}. ${p.title} (${p.categoryLabel}, ₹${p.price}, rating ${p.rating}, ${Object.entries(p.specs)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')})`
  ).join('\n');

  const greetingByLang: Record<LangCode, string> = {
    'en-IN': 'Namaste! Welcome to VoicoCart. Tell me what gear or budget you are looking for today.',
    'hi-IN': 'नमस्ते! वॉइकोकार्ट में आपका स्वागत है। बताइए आज आप क्या खरीदना चाहते हैं?',
    'kn-IN': 'ನಮಸ್ಕಾರ! ವಾಯ್ಕೋಕಾರ್ಟ್‌ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಿಮಗೆ ಯಾವ ಗ್ಯಾಜೆಟ್ ಅಥವಾ ಬಜೆಟ್ ಬೇಕು ಹೇಳಿ?',
    'ta-IN': 'வணக்கம்! வாய்கோகார்ட்டிற்கு வரவேற்கிறோம். இன்று என்ன பொருள் வாங்க விரும்புகிறீர்கள்?',
    'te-IN': 'నమస్కారం! వాయికోకార్ట్‌కు స్వాగతం. ఈరోజు మీరు ఏం కొనాలనుకుంటున్నారు?',
  };

  const systemPrompt = `You are VoicoCart's live conversational shopping assistant powered by Agora Voice AI and Murf Falcon 2.
Speak naturally and concisely (under 24 words per reply) in the shopper's language (${lang}). Never use markdown bullets or emojis in spoken text.
Important: The VoicoCart app automatically executes navigation, cart additions/removals, product comparisons, 2D/3D view toggling, saving profile details & delivery addresses, checkout form filling, and payment triggers in real time as the shopper speaks.
Never claim there was a technical issue or say you cannot access the cart, profile, saved addresses, or checkout form.
Store catalog (prices in Indian Rupees):
${catalogSummary}
Current context: screen=${String(context.screen ?? 'home')}, cartCount=${Number(context.cartCount ?? 0)}.
On checkout or profile, help fill and save name, 10-digit mobile, street address, city, state, and 6-digit PIN code.`;

  try {
    const joinRes = await fetch(
      `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`,
      {
        method: 'POST',
        headers: {
          Authorization: `agora token="${restToken}"`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `voicocart_${channelName}_${Date.now().toString(36)}`,
          properties: {
            channel: channelName,
            token: agentToken,
            agent_rtc_uid: String(agentUid),
            remote_rtc_uids: [userUid],
            idle_timeout: 120,
            parameters: {
              data_channel: 'datastream',
              enable_error_message: true,
            },
            asr: {
              vendor: 'ares',
              language: voice.asrLanguage,
            },
            llm: {
              url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
              api_key: geminiKey,
              style: 'openai',
              params: {
                model: 'gemini-3.1-flash-lite',
                max_tokens: 140,
              },
              system_messages: [{ role: 'system', content: systemPrompt }],
              greeting_message: greetingByLang[lang] ?? greetingByLang['en-IN'],
              failure_message: 'Sorry, I missed that. Could you repeat your shopping request?',
              max_history: 16,
            },
            tts: {
              vendor: 'murf',
              params: {
                api_key: murfKey,
                base_url: 'wss://global.api.murf.ai/v1/speech/stream-input',
                voice_id: voice.voiceId,
                locale: voice.locale,
                model: voice.model ?? 'FALCON',
                sample_rate: 24000,
                rate: 0,
                pitch: 0,
              },
            },
          },
        }),
      }
    );

    const payload = (await joinRes.json()) as {
      agent_id?: string;
      status?: string;
      detail?: string;
      message?: string;
    };

    if (!joinRes.ok || !payload.agent_id) {
      return {
        status: 502,
        data: {
          error: payload.detail ?? payload.message ?? 'Failed to start Agora Conversational AI agent.',
        },
      };
    }

    return {
      status: 200,
      data: {
        agentId: payload.agent_id,
        status: payload.status ?? 'RUNNING',
        channelName,
        agentUid,
        voiceId: voice.voiceId,
        displayName: voice.displayName,
        locale: voice.locale,
      },
    };
  } catch (err) {
    return {
      status: 502,
      data: {
        error: err instanceof Error ? err.message : 'Unable to reach Agora Conversational AI API.',
      },
    };
  }
}

export async function handleAgoraStop(body: Record<string, unknown>): Promise<HandlerResult> {
  const { appId, appCert } = getAgoraCredentials();
  const agentId = typeof body?.agentId === 'string' ? body.agentId.trim() : '';
  const channelName =
    typeof body?.channelName === 'string' && body.channelName.trim()
      ? body.channelName.trim()
      : 'voicocart-leave';

  if (!appId || !appCert) {
    return { status: 503, data: { error: 'Agora credentials not configured.' } };
  }
  if (!agentId) {
    return { status: 400, data: { error: 'agentId is required.' } };
  }

  try {
    const restToken = buildAgoraRtcToken(appId, appCert, channelName, 0, 600);
    const leaveRes = await fetch(
      `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${encodeURIComponent(agentId)}/leave`,
      {
        method: 'POST',
        headers: {
          Authorization: `agora token="${restToken}"`,
        },
      }
    );
    return {
      status: leaveRes.ok ? 200 : 502,
      data: { ok: leaveRes.ok, agentId },
    };
  } catch (err) {
    return {
      status: 502,
      data: { error: err instanceof Error ? err.message : 'Failed to stop Agora agent.' },
    };
  }
}

export async function handleMurfTts(body: Record<string, unknown>): Promise<HandlerResult> {
  const { murfKey } = getAgoraCredentials();
  if (!murfKey) {
    return { status: 503, data: { error: 'MURF_API_KEY is not configured.' } };
  }

  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return { status: 400, data: { error: 'text is required.' } };
  }

  const lang = (typeof body?.lang === 'string' ? body.lang : 'en-IN') as LangCode;
  const rawGender = body?.voiceGender;
  const voiceGender: VoiceGender =
    rawGender === 'cloned' ? 'cloned' : rawGender === 'male' ? 'male' : 'female';
  const voice = resolveMurfVoice(lang, voiceGender);

  const isFalcon21 = voice.model === 'falcon-2.1';
  const endpoints = isFalcon21
    ? [
        'https://global.api.murf.ai/v1/speech/stream',
        'https://in.api.murf.ai/v1/speech/stream',
      ]
    : [
        'https://in.api.murf.ai/v1/speech/stream',
        'https://global.api.murf.ai/v1/speech/stream',
      ];

  const candidateLocales = Array.from(
    new Set(isFalcon21 ? [voice.locale, 'en-US', 'en-IN'] : [voice.locale])
  );
  const candidateModels = isFalcon21 ? ['falcon-2.1', 'FALCON'] : ['FALCON'];

  for (const model of candidateModels) {
    for (const targetLocale of candidateLocales) {
      const payload = JSON.stringify({
        text: text.slice(0, 600),
        voiceId: voice.voiceId,
        model,
        locale: targetLocale,
        format: 'MP3',
        sampleRate: 24000,
        ...(voice.channelType ? { channelType: voice.channelType } : {}),
      });

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'api-key': murfKey,
              'Content-Type': 'application/json',
            },
            body: payload,
          });
          if (res.ok) {
            const arrBuf = await res.arrayBuffer();
            return {
              status: 200,
              binary: Buffer.from(arrBuf),
              contentType: 'audio/mpeg',
            };
          }
        } catch {
          // Try next Murf endpoint/locale
        }
      }
    }
  }

  return { status: 502, data: { error: 'Failed to synthesize audio via Murf Falcon.' } };
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

  const systemInstruction = `You are the voice NLU intent router for VoicoCart (an Indian dark-mode electronics & gear store).
Map natural, conversational, Hinglish, Hindi, Kannada, Tamil, Telugu, or English shopping requests into structured intent + entities JSON.
Never invent products or prices; only extract what the user wants or refers to.
Active store categories:
- audio (wireless earbuds, ANC headphones)
- wearables (smartwatch, fitness tracker)
- smart-home (smart speaker, desk light bar)
- footwear (running shoes, sneakers)
- peripherals (mechanical keyboard, wireless gaming mouse)
- cameras (4K action & vlog camera)
- eyewear (AI smart sunglasses)
- accessories (MagSafe power bank, commuter tech sling bag)
- gaming (Hall-Effect gamepad controller, wireless esports headset)
- workspace (Thunderbolt 4 rotary dock, MagSafe desk console)
- fitness (percussive massage gun, screenless HRV recovery strap)
- travel (140W GaN travel brick charger, hard-shell tech organizer)
Extraction rules:
- If the user mentions any budget or price cap (e.g. "around 3000", "under 2k", "budget 5000"), always set entities.maxPrice as a number in INR.
- Map activity/occasion words to the best matching category and search query (e.g. "morning jog" -> category="footwear", query="running shoes"; "gaming" -> category="gaming", query="gamepad"; "gym music" -> category="audio", query="wireless earbuds"; "travel adapter" -> category="travel", query="gan charger").
- Use FILL_CHECKOUT whenever the user provides delivery details (name, phone, street line1, city, state, pincode), selects card/upi, provides upiId, asks to use saved address, or says pay now / submit payment. Set saveAddress=true if they also ask to save it.
- Use SAVE_ADDRESS when the user asks to save/add a delivery address to their profile or save the current address (populate checkoutFields + saveAddress=true).
- Use UPDATE_PROFILE when the user asks to update or save their personal profile fullName or phone number (populate profileFields).
- When the user asks to "show me the full product in 3d view", "show the second one in 3d", or "open <product> in 3D view", use ASK_PRODUCT with simpleView=false and populate productRef (index, name, or this=true if unspecified). Never emit SEARCH_PRODUCTS for "full product in 3d view".
- Use TOGGLE_SIMPLE_VIEW when the user asks to turn on/off Simple View or switch between 2D studio photos (simpleView=true) and 3D view (simpleView=false).
- Use NAVIGATE with targetRoute (home, results, product, compare, cart, checkout, orders, profile) when the user asks to go to or open a page.
- Use followUpActions if the user asks for multiple actions in one turn (e.g., ADD_TO_CART followed by CHECKOUT, or FILL_CHECKOUT followed by CHECKOUT).
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
    if (result.binary) {
      res.setHeader('Content-Type', result.contentType ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.end(result.binary);
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data ?? {}));
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
