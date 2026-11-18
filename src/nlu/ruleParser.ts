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
  if (/(speaker|smart home|alexa|स्पीकर)/i.test(text)) return 'smart-home';
  if (/(shoe|sneaker|running|footwear|जूते)/i.test(text)) return 'footwear';
  if (/(keyboard|mechanical|mouse|peripheral|कीबोर्ड)/i.test(text)) return 'peripherals';
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

export function ruleParse(transcript: string): ParsedIntent {
  const raw = transcript.trim();
  const t = raw.toLowerCase();

  if (!t) return { intent: 'UNKNOWN', entities: {}, confidence: 0 };

  // 1. Language Switch
  if (
    /\b(speak in|switch to|change language|language)\b/i.test(raw) ||
    /(में बोलो|ಮಾತನಾಡು|பேசவும்|తెలుగులో)/i.test(raw) ||
    /^(हिन्दी|हिंदी|ಕನ್ನಡ|தமிழ்|తెలుగు)$/i.test(raw)
  ) {
    const lang = detectLangSwitch(raw);
    if (lang) return { intent: 'CHANGE_LANGUAGE', entities: { lang }, confidence: 0.95 };
  }

  // 2. Help
  if (/^(help|what can you do|commands|मदद)\b/i.test(raw)) {
    return { intent: 'HELP', entities: {}, confidence: 0.92 };
  }

  // 3. Explicit Confirm / Deny
  if (/^(yes|yeah|yep|confirm|go ahead|proceed|sure|ok|okay|haan|हाँ|हां|ಹೌದು)$/i.test(raw)) {
    return { intent: 'CONFIRM', entities: {}, confidence: 0.95 };
  }
  if (/^(no|nope|cancel|stop|don't|change address|nahi|नहीं|ಬೇಡ)$/i.test(raw)) {
    return { intent: 'DENY', entities: {}, confidence: 0.95 };
  }

  // 4. Show Cart (English + Hindi + Kannada)
  if (
    /\b(show|open|view|check|what(?:'s|\s+is)\s+in)\s+(my\s+)?cart\b/i.test(t) ||
    /(मेरा\s*कार्ट|कार्ट\s*दिखाओ|ಕಾರ್ಟ್)/i.test(raw)
  ) {
    return { intent: 'SHOW_CART', entities: {}, confidence: 0.95 };
  }

  // 5. Checkout
  if (/\b(checkout|pay now|proceed to pay|place order|buy now|payment|ऑर्डर करो|पेमेंट)\b/i.test(raw)) {
    return { intent: 'CHECKOUT', entities: {}, confidence: 0.95 };
  }

  // 6. Track Order
  if (/\b(where is my order|track(\s+my)?\s+order|order status|delivery status|मेरा ऑर्डर|ऑर्डर कहाँ)\b/i.test(raw)) {
    return { intent: 'TRACK_ORDER', entities: {}, confidence: 0.94 };
  }

  // 7. Return Item
  if (/\b(return|refund|replace|वापस|रिटर्न)\b/i.test(raw)) {
    const reasonMatch = raw.match(/(?:because|reason|wrong|defective|damaged|size|broken)(.*)$/i);
    const reason = reasonMatch ? reasonMatch[0].trim() : raw.replace(/\b(i want to|please|return|the|my)\b/gi, '').trim();
    const productRef = extractRef(raw) ?? { name: raw };
    return {
      intent: 'RETURN_ITEM',
      entities: { productRef, reason: reason || 'Customer requested return' },
      confidence: 0.88,
    };
  }

  // 8. Compare Products
  if (/\b(compare|vs|versus|difference between|तुलना)\b/i.test(raw)) {
    const refs: ProductRef[] = [];
    for (const [word, idx] of Object.entries(ORDINAL_MAP)) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      if (re.test(raw) && !refs.some((r) => r.index === idx)) {
        refs.push({ index: idx });
      }
    }
    const digitMatches = raw.matchAll(/\b([1-6])\b/g);
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

  // 9. Remove from Cart
  if (/\b(remove|delete|drop|take out|हटाओ|निकालो)\b/i.test(raw)) {
    const productRef = extractRef(raw) ?? {
      name: raw.replace(/\b(remove|delete|from|my|cart|the|please|हटाओ)\b/gi, '').trim(),
    };
    return { intent: 'REMOVE_FROM_CART', entities: { productRef }, confidence: 0.9 };
  }

  // 10. Update Quantity
  if (/\b(make it|set quantity|quantity|change quantity)\b/i.test(t)) {
    const qtyMatch = t.match(/\b(\d+|one|two|three|four|five)\b/);
    const quantity = qtyMatch ? parseNumberWords(qtyMatch[1]) ?? ORDINAL_MAP[qtyMatch[1]] ?? 1 : 1;
    return {
      intent: 'UPDATE_QUANTITY',
      entities: { productRef: extractRef(raw) ?? { this: true }, quantity },
      confidence: 0.88,
    };
  }

  // 11. Add to Cart ("add the second one", "add this in black")
  if (/\b(add|put|जोड़ो|डालो|ಸೇರಿಸಿ)\b/i.test(raw)) {
    const productRef = extractRef(raw) ?? {
      name: raw.replace(/\b(add|put|to|my|cart|the|in|please|buy)\b/gi, '').trim(),
    };
    const color = COLOR_WORDS.find((c) => t.includes(c));
    const qtyMatch = t.match(/\b(\d+)\s*(?:pcs|pieces|items|units)?\b/);
    const quantity = qtyMatch && !t.includes('number') ? Math.min(Number(qtyMatch[1]), 10) : 1;
    return {
      intent: 'ADD_TO_CART',
      entities: { productRef, variant: color, quantity },
      confidence: 0.92,
    };
  }

  // 12. Ask about product / open product detail ("tell me more about the second one", "is it waterproof?")
  if (
    /\b(tell me more|details|open|inspect|show details|is it|does it|battery|waterproof|warranty)\b/i.test(t)
  ) {
    const productRef = extractRef(raw) ?? { this: true };
    return {
      intent: 'ASK_PRODUCT',
      entities: { productRef, question: raw },
      confidence: 0.88,
    };
  }

  // 13. Recommend ("gift for my mom", "best budget phone")
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

  // 14. Search Products ("show me wireless earbuds under 2000", "running shoes under 3000")
  const priceMatch = raw.match(
    /(?:under|below|less than|within|cheaper than|से कम|ಒಳಗೆ)\s+([^\n?.!]+?)(?:\s*(?:rupees|rs|₹|रुपये))?$/i
  );
  const maxPrice = priceMatch ? parseNumberWords(priceMatch[1]) : undefined;

  if (
    /\b(show|find|search|looking for|i want|i need|browse|explore|दिखाओ|खोजो|ತೋರಿಸು)\b/i.test(raw) ||
    inferCategory(raw) !== undefined ||
    maxPrice !== undefined
  ) {
    const cleanedQuery = raw
      .replace(/\b(show me|find me|find|search for|search|looking for|i want|i need|browse|दिखाओ|खोजो|ತೋರಿಸು)\b/gi, '')
      .replace(/(?:under|below|less than|within|cheaper than|से कम|ಒಳಗೆ).*$/i, '')
      .replace(/\b(please|some|good|best)\b/gi, '')
      .trim();

    return {
      intent: 'SEARCH_PRODUCTS',
      entities: {
        query: cleanedQuery,
        category: inferCategory(raw),
        maxPrice,
      },
      confidence: 0.85,
    };
  }

  return { intent: 'UNKNOWN', entities: {}, confidence: 0 };
}
