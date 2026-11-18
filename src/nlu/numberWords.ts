const ONES: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  एक: 1,
  दो: 2,
  तीन: 3,
  चार: 4,
  पांच: 5,
  पाँच: 5,
  छह: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  दस: 10,
  ಒಂದು: 1,
  ಎರಡು: 2,
  ಮೂರು: 3,
  ನಾಲ್ಕು: 4,
  ಐದು: 5,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALES: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  k: 1000,
  सौ: 100,
  हज़ार: 1000,
  हजार: 1000,
  ಸಾವಿರ: 1000,
  ನೂರು: 100,
};

/**
 * Parses numeric digits, "2k", "2,500", "two thousand", "fifteen hundred",
 * "दो हज़ार", or "ಎರಡು ಸಾವಿರ" into a clean positive number.
 */
export function parseNumberWords(raw: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.toLowerCase().replace(/₹|rs\.?|rupees?|रुपये/gi, '').trim();

  // Direct shorthand like "2k", "3.5k", "2,500", "3000"
  const compactMatch = cleaned.match(/^([\d,]+(?:\.\d+)?)\s*(k)?$/);
  if (compactMatch) {
    const base = Number(compactMatch[1].replace(/,/g, ''));
    if (Number.isFinite(base)) {
      return compactMatch[2] ? Math.round(base * 1000) : Math.round(base);
    }
  }

  // Embedded digit with thousand/k e.g. "2 thousand"
  const mixedMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(thousand|k|hundred|हज़ार|हजार|ಸಾವಿರ)/);
  if (mixedMatch) {
    const base = Number(mixedMatch[1]);
    const scale = SCALES[mixedMatch[2]] ?? 1;
    if (Number.isFinite(base)) return Math.round(base * scale);
  }

  // Pure word parsing
  const words = cleaned.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const w of words) {
    if (w in ONES) {
      current += ONES[w];
      matchedAny = true;
    } else if (w in TENS) {
      current += TENS[w];
      matchedAny = true;
    } else if (w === 'hundred' || w === 'सौ' || w === 'ನೂರು') {
      current = (current || 1) * 100;
      matchedAny = true;
    } else if (w === 'thousand' || w === 'हज़ार' || w === 'हजार' || w === 'ಸಾವಿರ') {
      total += (current || 1) * 1000;
      current = 0;
      matchedAny = true;
    }
  }

  const result = total + current;
  return matchedAny && result > 0 ? result : undefined;
}
