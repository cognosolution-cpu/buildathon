import type { LangCode, ParsedIntent, Product, ProductRef } from '../types';
import { parseNumberWords } from './numberWords';

const STRICT_ORDINALS: Array<[string, number]> = [
  ['first', 1],
  ['1st', 1],
  ['पहला', 1],
  ['ಮೊದಲ', 1],
  ['second', 2],
  ['2nd', 2],
  ['दूसरा', 2],
  ['ಎರಡನೇ', 2],
  ['third', 3],
  ['3rd', 3],
  ['तीसरा', 3],
  ['fourth', 4],
  ['4th', 4],
  ['fifth', 5],
  ['5th', 5],
  ['sixth', 6],
  ['6th', 6],
];

const CARDINAL_REFS: Array<[string, number]> = [
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
];

const ORDINAL_MAP: Record<string, number> = Object.fromEntries([
  ...STRICT_ORDINALS,
  ...CARDINAL_REFS,
]);

const COLOR_WORDS = ['black', 'obsidian', 'amber', 'orange', 'gold', 'silver', 'titanium', 'slate', 'bronze', 'charcoal'];

function inferCategory(text: string): Product['category'] | undefined {
  if (/(earbud|headphone|headset|audio|earphone|tws|ईयरबड्स|हेडफोन)/i.test(text)) return 'audio';
  if (/(watch|smartwatch|tracker|fitness|घड़ी)/i.test(text)) return 'wearables';
  if (/(speaker|smart home|alexa|lamp|light\s*bar|desk\s*light|स्पीकर)/i.test(text)) return 'smart-home';
  if (/(shoe|sneaker|running|footwear|जूते)/i.test(text)) return 'footwear';
  if (/(keyboard|mechanical|mouse|peripheral|कीबोर्ड|माउस)/i.test(text)) return 'peripherals';
  if (/(camera|action\s*cam|vlog|कैमरा)/i.test(text)) return 'cameras';
  if (/(glass|glasses|sunglass|eyewear|चश्मा)/i.test(text)) return 'eyewear';
  if (/(power\s*bank|magsafe|charger|bag|sling|backpack|बैग|पावर\s*बैंक)/i.test(text)) return 'accessories';
  return undefined;
}

function extractRef(text: string): ProductRef | undefined {
  for (const [word, idx] of STRICT_ORDINALS) {
    const regex = new RegExp(`(?:^|\\s)(?:the\\s+)?${word}(?:\\s+one)?(?:\\s|$|[?.!,])`, 'i');
    if (regex.test(text)) return { index: idx };
  }
  const numMatch = text.match(/\b(?:number|item|#)\s*(\d+)\b/i) ?? text.match(/\b(\d+)\b/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 1 && n <= 10) return { index: n };
  }
  for (const [word, idx] of CARDINAL_REFS) {
    const regex = new RegExp(`(?:^|\\s)${word}(?:\\s|$|[?.!,])`, 'i');
    if (regex.test(text)) return { index: idx };
  }
  if (/\b(this|it|current|ये|यह)\b/i.test(text)) {
    return { this: true };
  }
  return undefined;
}

function detectLangSwitch(text: string): LangCode | undefined {
  if (/(hindi|हिन्दी|हिंदी)/i.test(text)) return 'hi-IN';
  if (/(kannada|ಕನ್ನಡ)/i.test(text)) return 'kn-IN';
  if (/(tamil|தமிழ்)/i.test(text)) return 'ta-IN';
  if (/(telugu|తెలుగు)/i.test(text)) return 'te-IN';
  if (/(english|अंग्रेजी|अंग्रेज़ी)/i.test(text)) return 'en-IN';
  return undefined;
}

const FILLER_PATTERN =
  /\b(add|put|back|again|to|my|the|in|into|cart|basket|bag|please|buy|item|product|and|then|now|me|it)\b/gi;

function cleanProductName(text: string): string {
  return text
    .replace(/\b(?:and|then)\s+(?:go\s+to|open|redirect(?:\s+me)?\s+to|take\s+me\s+to|proceed\s+to|move\s+to)?\s*(?:check\s*out|cart|payment).*$/i, '')
    .replace(FILLER_PATTERN, ' ')
    .replace(/[.,!?।]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCheckoutEntities(raw: string): ParsedIntent['entities'] | null {
  const wantsSaveAddress =
    /\b(save\s+(?:this\s+|my\s+)?(?:delivery\s+|shipping\s+)?address|add\s+(?:a\s+|new\s+)?(?:delivery\s+|shipping\s+)?address|store\s+(?:my\s+)?address|save\s+(?:address\s+)?to\s+(?:my\s+)?profile)\b/i.test(
      raw
    ) ||
    (/\bsave\b/i.test(raw) && /\baddress\b/i.test(raw));

  const fields: Partial<import('../types').CheckoutDraft> = {};
  const nameMatch = raw.match(/\b(?:my\s+name\s+is|name\s*(?:is|:)?|for)\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?=\s*(?:,|phone|mobile|number|address|street|city|state|pin|pincode|zip|and\b|$))/i);
  if (nameMatch?.[1]) fields.name = nameMatch[1].trim();

  const phoneMatch = raw.match(/(?:\+91[\s-]?)?\b([6-9]\d{9})\b/);
  if (phoneMatch?.[1]) fields.phone = phoneMatch[1];

  const pinMatch = raw.match(/\b(\d{6})\b/);
  if (pinMatch?.[1]) fields.pincode = pinMatch[1];

  const lineCandidates = Array.from(
    raw.matchAll(
      /\b(?:street\s+address|address\s+line(?:\s*1)?|address)\s*(?:is|as|:)?\s+(?!(?:name|phone|mobile|full\s*name|recipient|city|state|pin|pincode|to\s+(?:my\s+)?profile)\b)([^,.\n]{4,90}?)(?=\s*(?:,|city|state|pin|pincode|phone|mobile|and\s+city|$))/gi
    )
  );
  const lineMatch = lineCandidates[0];
  if (lineMatch?.[1]) fields.line1 = lineMatch[1].trim();

  const cityMatch = raw.match(/\bcity\s*(?:is|:)?\s+([a-zA-Z\s]{2,35}?)(?=\s*(?:,|state|pin|pincode|phone|and\s+state|$))/i);
  if (cityMatch?.[1]) fields.city = cityMatch[1].trim();

  const stateMatch = raw.match(/\bstate\s*(?:is|:)?\s+([a-zA-Z\s]{2,35}?)(?=\s*(?:,|pin|pincode|phone|city|and\s+pin|$))/i);
  if (stateMatch?.[1]) fields.state = stateMatch[1].trim();

  const upiMatch = raw.match(/\b([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)\b/);
  const payMethod = /\bupi\b/i.test(raw)
    ? ('upi' as const)
    : /\b(card|credit card|debit card)\b/i.test(raw)
      ? ('card' as const)
      : undefined;
  const useSavedAddress = /\b(use\s+saved\s+address|saved\s+address|default\s+address)\b/i.test(raw);
  const submitPayment = /\b(confirm\s+payment|submit\s+payment|complete\s+payment|pay\s+now|place\s+order)\b/i.test(raw);

  const hasAny =
    Object.keys(fields).length > 0 ||
    Boolean(payMethod) ||
    Boolean(upiMatch) ||
    useSavedAddress ||
    submitPayment ||
    wantsSaveAddress;

  if (!hasAny) return null;

  return {
    checkoutFields: Object.keys(fields).length > 0 ? fields : undefined,
    saveAddress: wantsSaveAddress || undefined,
    payMethod,
    upiId: upiMatch?.[1],
    useSavedAddress: useSavedAddress || undefined,
    submitPayment: submitPayment || undefined,
  };
}

export function ruleParse(transcript: string): ParsedIntent {
  const raw = transcript.trim();
  const normalized = raw.replace(/[.,!?।]+/g, ' ').replace(/\s+/g, ' ').trim();
  const t = normalized.toLowerCase();

  if (!t) return { intent: 'UNKNOWN', entities: {}, confidence: 0 };

  // 1. Language Switch
  if (
    /\b(speak in|switch to|change language|language)\b/i.test(normalized) ||
    /(में बोलो|ಮಾತನಾಡು|பேசவும்|తెలుగులో)/i.test(raw) ||
    /^(हिन्दी|हिंदी|ಕನ್ನಡ|தமிழ்|తెలుగు)$/i.test(normalized)
  ) {
    const lang = detectLangSwitch(raw);
    if (lang) return { intent: 'CHANGE_LANGUAGE', entities: { lang }, confidence: 0.95 };
  }

  // 2. Help
  if (/^(help|what can you do|commands|मदद)\b/i.test(normalized)) {
    return { intent: 'HELP', entities: {}, confidence: 0.92 };
  }

  // 3. Explicit Confirm / Deny
  if (/^(yes|yeah|yep|confirm|go ahead|proceed|sure|ok|okay|haan|हाँ|हां|ಹೌದು)$/i.test(normalized)) {
    return { intent: 'CONFIRM', entities: {}, confidence: 0.95 };
  }
  if (/^(no|nope|cancel|stop|don't|change address|nahi|नहीं|ಬೇಡ)$/i.test(normalized)) {
    return { intent: 'DENY', entities: {}, confidence: 0.95 };
  }

  // 4. Sign in with Google
  if (/\b(sign\s*in\s+with\s+google|continue\s+with\s+google|google\s+login|google\s+sign\s*in)\b/i.test(normalized)) {
    return { intent: 'SIGN_IN_GOOGLE', entities: {}, confidence: 0.95 };
  }

  // 4b. Simple View / 2D Studio Photos vs 3D View toggle
  if (/\b(simple\s+view|2d\s+(?:studio\s+)?photos?|studio\s+photos?\s+mode)\b/i.test(normalized)) {
    const turnOff = /\b(off|disable|exit|stop|3d)\b/i.test(normalized);
    return {
      intent: 'TOGGLE_SIMPLE_VIEW',
      entities: { simpleView: !turnOff },
      confidence: 0.94,
    };
  }
  if (/\b(switch\s+to\s+3d|enable\s+3d|3d\s+view\s+mode|turn\s+on\s+3d)\b/i.test(normalized)) {
    return {
      intent: 'TOGGLE_SIMPLE_VIEW',
      entities: { simpleView: false },
      confidence: 0.94,
    };
  }

  // 4c. Profile / Personal Information update via AI
  if (
    /\b(profile|personal\s+info(?:rmation)?|account\s+details|my\s+mobile|my\s+phone)\b/i.test(normalized) &&
    /\b(update|save|set|change|fill|edit)\b/i.test(normalized) &&
    !/\baddress|city|state|pincode|pin\b/i.test(normalized)
  ) {
    const nameMatch = raw.match(/\b(?:name\s*(?:is|to|as|:)?)\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?=\s*(?:,|and\b|phone|mobile|number|$))/i);
    const phoneMatch = raw.match(/(?:\+91[\s-]?)?\b([6-9]\d{9})\b/);
    if (nameMatch?.[1] || phoneMatch?.[1]) {
      return {
        intent: 'UPDATE_PROFILE',
        entities: {
          profileFields: {
            ...(nameMatch?.[1] ? { fullName: nameMatch[1].trim() } : {}),
            ...(phoneMatch?.[1] ? { phone: phoneMatch[1] } : {}),
          },
        },
        confidence: 0.93,
      };
    }
  }

  // 5. Clear cart
  if (/\b(clear|empty)\s+(my\s+)?cart\b/i.test(normalized)) {
    return { intent: 'CLEAR_CART', entities: {}, confidence: 0.94 };
  }

  // 6. Compound Add-to-Cart + Checkout/Cart ("Add PulseBuds Air ANC and redirect to checkout")
  const wantsCheckout =
    /\b(check\s*out|pay\s*now|proceed\s+to\s+pay|place\s+(my\s+)?order|buy\s*now|payment\s*page|ऑर्डर करो|पेमेंट)\b/i.test(
      normalized
    );
  const wantsCartView =
    /\b(show|open|view|go\s+to|take\s+me\s+to|redirect(?:\s+me)?\s+to|check|what(?:'s|\s+is)\s+in)\s+(my\s+)?cart\b/i.test(
      t
    ) || /(मेरा\s*कार्ट|कार्ट\s*दिखाओ|ಕಾರ್ಟ್)/i.test(raw);
  const wantsAdd = /\b(add|put|जोड़ो|डालो|ಸೇರಿಸಿ)\b/i.test(normalized);

  if (wantsAdd && (wantsCheckout || wantsCartView)) {
    const ref = extractRef(normalized) ?? { name: cleanProductName(normalized) };
    const color = COLOR_WORDS.find((c) => t.includes(c));
    const qtyMatch = t.match(/\b(\d+)\s*(?:pcs|pieces|items|units)?\b/);
    const quantity = qtyMatch && !t.includes('number') ? Math.min(Number(qtyMatch[1]), 10) : 1;
    const followUp: ParsedIntent = wantsCheckout
      ? { intent: 'CHECKOUT', entities: {}, confidence: 0.95 }
      : { intent: 'SHOW_CART', entities: {}, confidence: 0.95 };
    return {
      intent: 'ADD_TO_CART',
      entities: { productRef: ref, variant: color, quantity },
      confidence: 0.94,
      followUpActions: [followUp],
    };
  }

  // 7. Save Address OR Checkout Form Filling & Payment Controls
  const checkoutEntities = extractCheckoutEntities(raw);
  if (checkoutEntities && (!wantsAdd || checkoutEntities.saveAddress)) {
    if (checkoutEntities.saveAddress && !wantsCheckout && !checkoutEntities.payMethod && !checkoutEntities.submitPayment) {
      return {
        intent: 'SAVE_ADDRESS',
        entities: checkoutEntities,
        confidence: 0.93,
      };
    }
    const fieldCount = Object.keys(checkoutEntities.checkoutFields ?? {}).length;
    const looksLikeFullAddressSpeech =
      /\b(fill|enter|set|save|my|address|checkout|deliver|ship)\b/i.test(t) && raw.split(/\s+/).length >= 6;
    const conf =
      looksLikeFullAddressSpeech &&
      fieldCount < 2 &&
      !checkoutEntities.useSavedAddress &&
      !checkoutEntities.payMethod &&
      !checkoutEntities.saveAddress
        ? 0.6
        : 0.92;
    return {
      intent: 'FILL_CHECKOUT',
      entities: checkoutEntities,
      confidence: conf,
    };
  }

  // 8. Show Cart (English + Hindi + Kannada)
  if (wantsCartView) {
    return { intent: 'SHOW_CART', entities: {}, confidence: 0.95 };
  }

  // 9. Checkout Navigation
  if (wantsCheckout) {
    return { intent: 'CHECKOUT', entities: {}, confidence: 0.95 };
  }

  // 10. General Screen Navigation ("open profile", "go to sign in", "go home", "open explore")
  if (/\b(go\s+to|open|show|take\s+me\s+to|redirect(?:\s+me)?\s+to|navigate\s+to|view)\b/i.test(normalized)) {
    if (/\b(profile|sign\s*in|login|account|settings|preferences)\b/i.test(normalized)) {
      return { intent: 'NAVIGATE', entities: { targetRoute: 'profile' }, confidence: 0.94 };
    }
    if (/\b(home|main\s*page|start)\b/i.test(normalized)) {
      return { intent: 'NAVIGATE', entities: { targetRoute: 'home' }, confidence: 0.94 };
    }
    if (/\b(explore|catalog|products|store|shop)\b/i.test(normalized)) {
      return { intent: 'NAVIGATE', entities: { targetRoute: 'results' }, confidence: 0.92 };
    }
    if (/\b(compare|comparison)\b/i.test(normalized)) {
      return { intent: 'NAVIGATE', entities: { targetRoute: 'compare' }, confidence: 0.92 };
    }
    if (/\b(orders|my\s+orders)\b/i.test(normalized)) {
      return { intent: 'NAVIGATE', entities: { targetRoute: 'orders' }, confidence: 0.92 };
    }
  }

  // 11. Track Order
  if (/\b(where is my order|track(\s+my)?\s+order|order status|delivery status|मेरा ऑर्डर|ऑर्डर कहाँ)\b/i.test(normalized)) {
    return { intent: 'TRACK_ORDER', entities: {}, confidence: 0.94 };
  }

  // 12. Return Item
  if (/\b(return|refund|replace|वापस|रिटर्न)\b/i.test(normalized)) {
    const reasonMatch = normalized.match(/(?:because|reason|wrong|defective|damaged|size|broken)(.*)$/i);
    const reason = reasonMatch
      ? reasonMatch[0].trim()
      : normalized.replace(/\b(i want to|please|return|the|my)\b/gi, '').trim();
    const productRef = extractRef(normalized) ?? { name: cleanProductName(normalized) };
    return {
      intent: 'RETURN_ITEM',
      entities: { productRef, reason: reason || 'Customer requested return' },
      confidence: 0.88,
    };
  }

  // 13. Compare Products
  if (/\b(compare|vs|versus|difference between|तुलना)\b/i.test(normalized)) {
    const refs: ProductRef[] = [];
    for (const [word, idx] of Object.entries(ORDINAL_MAP)) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      if (re.test(normalized) && !refs.some((r) => r.index === idx)) {
        refs.push({ index: idx });
      }
    }
    const digitMatches = normalized.matchAll(/\b([1-6])\b/g);
    for (const m of digitMatches) {
      const idx = Number(m[1]);
      if (!refs.some((r) => r.index === idx)) refs.push({ index: idx });
    }
    if (/\b(this|it)\b/i.test(t) && !refs.some((r) => r.this)) {
      refs.unshift({ this: true });
    }
    return {
      intent: 'COMPARE',
      entities: { productRefs: refs },
      confidence: refs.length >= 2 ? 0.94 : 0.82,
    };
  }

  // 14. Remove from Cart
  if (/\b(remove|delete|drop|take out|हटाओ|निकालो)\b/i.test(normalized)) {
    const productRef = extractRef(normalized) ?? {
      name: cleanProductName(normalized.replace(/\b(remove|delete|drop|take out|from|हटाओ|निकालो)\b/gi, ' ')),
    };
    return { intent: 'REMOVE_FROM_CART', entities: { productRef }, confidence: 0.9 };
  }

  // 15. Update Quantity
  if (/\b(make it|set quantity|quantity|change quantity)\b/i.test(t)) {
    const qtyMatch = t.match(/\b(\d+|one|two|three|four|five)\b/);
    const quantity = qtyMatch ? parseNumberWords(qtyMatch[1]) ?? ORDINAL_MAP[qtyMatch[1]] ?? 1 : 1;
    return {
      intent: 'UPDATE_QUANTITY',
      entities: { productRef: extractRef(normalized) ?? { this: true }, quantity },
      confidence: 0.88,
    };
  }

  // 16. Add to Cart ("add the second one", "add PulseBuds Air ANC to my cart")
  if (wantsAdd) {
    const productRef = extractRef(normalized) ?? { name: cleanProductName(normalized) };
    const color = COLOR_WORDS.find((c) => t.includes(c));
    const qtyMatch = t.match(/\b(\d+)\s*(?:pcs|pieces|items|units)?\b/);
    const quantity = qtyMatch && !t.includes('number') ? Math.min(Number(qtyMatch[1]), 10) : 1;
    return {
      intent: 'ADD_TO_CART',
      entities: { productRef, variant: color, quantity },
      confidence: 0.92,
    };
  }

  // 17. Ask about product / open product detail ("tell me more about the second one", "is it waterproof?")
  if (
    /\b(tell me more|details|inspect|show details|is it|does it|battery|waterproof|warranty)\b/i.test(t)
  ) {
    const productRef = extractRef(normalized) ?? { this: true };
    return {
      intent: 'ASK_PRODUCT',
      entities: { productRef, question: raw },
      confidence: 0.88,
    };
  }

  // 18. Recommend ("gift for my mom", "best budget phone")
  if (/\b(recommend|suggest|gift for|best budget|top rated)\b/i.test(t)) {
    const maxMatch = t.match(/\b(?:under|below|less than|within|budget)\s+([^?.!]+?)$/);
    const maxPrice = maxMatch ? parseNumberWords(maxMatch[1]) : undefined;
    return {
      intent: 'RECOMMEND',
      entities: {
        occasion: raw,
        maxPrice,
        category: inferCategory(raw),
      },
      confidence: 0.86,
    };
  }

  // 19. Search Products ("show me wireless earbuds under 2000", "running shoes under 3000")
  const priceMatch = normalized.match(
    /(?:under|below|less than|within|cheaper than|से कम|ಒಳಗೆ)\s+([^\n?.!]+?)(?:\s*(?:rupees|rs|₹|रुपये))?$/i
  );
  const maxPrice = priceMatch ? parseNumberWords(priceMatch[1]) : undefined;

  if (
    /\b(show|find|search|looking for|i want|i need|browse|explore|दिखाओ|खोजो|ತೋರಿಸು)\b/i.test(normalized) ||
    inferCategory(normalized) !== undefined ||
    maxPrice !== undefined
  ) {
    const cleanedQuery = normalized
      .replace(/\b(show me|find me|find|search for|search|looking for|i want|i need|browse|दिखाओ|खोजो|ತೋರಿಸು)\b/gi, '')
      .replace(/(?:under|below|less than|within|cheaper than|से कम|ಒಳಗೆ).*$/i, '')
      .replace(/\b(please|some|good|best)\b/gi, '')
      .trim();

    return {
      intent: 'SEARCH_PRODUCTS',
      entities: {
        query: cleanedQuery,
        category: inferCategory(normalized),
        maxPrice,
      },
      confidence: 0.85,
    };
  }

  return { intent: 'UNKNOWN', entities: {}, confidence: 0 };
}
