import type { IntentType, LangCode, ParsedIntent, Product, ProductRef } from '../types';

const VALID_INTENTS: Set<IntentType> = new Set([
  'SEARCH_PRODUCTS',
  'RECOMMEND',
  'ASK_PRODUCT',
  'ADD_TO_CART',
  'REMOVE_FROM_CART',
  'UPDATE_QUANTITY',
  'COMPARE',
  'SHOW_CART',
  'CHECKOUT',
  'CONFIRM',
  'DENY',
  'TRACK_ORDER',
  'RETURN_ITEM',
  'CHANGE_LANGUAGE',
  'HELP',
  'UNKNOWN',
]);

const VALID_CATEGORIES: Set<Product['category']> = new Set([
  'audio',
  'wearables',
  'smart-home',
  'footwear',
  'peripherals',
]);

const VALID_LANGS: Set<LangCode> = new Set(['en-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN']);

function sanitizeRef(raw: unknown): ProductRef | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const ref: ProductRef = {};
  if (typeof obj.index === 'number' && Number.isInteger(obj.index) && obj.index >= 1 && obj.index <= 20) {
    ref.index = obj.index;
  }
  if (typeof obj.id === 'string' && obj.id.trim()) {
    ref.id = obj.id.trim().slice(0, 64);
  }
  if (typeof obj.name === 'string' && obj.name.trim()) {
    ref.name = obj.name.trim().slice(0, 80);
  }
  if (obj.this === true) {
    ref.this = true;
  }
  return Object.keys(ref).length > 0 ? ref : undefined;
}

export interface ValidatedLlmResult {
  parsed: ParsedIntent;
  replyHint?: string;
}

export function validateParsedIntent(raw: unknown): ValidatedLlmResult {
  if (!raw || typeof raw !== 'object') {
    return { parsed: { intent: 'UNKNOWN', confidence: 0, entities: {} } };
  }

  const record = raw as Record<string, unknown>;
  const rawIntent = typeof record.intent === 'string' ? (record.intent as IntentType) : 'UNKNOWN';
  const intent: IntentType = VALID_INTENTS.has(rawIntent) ? rawIntent : 'UNKNOWN';

  const rawConf = typeof record.confidence === 'number' && Number.isFinite(record.confidence)
    ? record.confidence
    : intent === 'UNKNOWN'
      ? 0
      : 0.78;
  const confidence = Math.max(0, Math.min(1, rawConf));

  const rawEntities =
    record.entities && typeof record.entities === 'object'
      ? (record.entities as Record<string, unknown>)
      : {};

  const entities: ParsedIntent['entities'] = {};

  if (typeof rawEntities.query === 'string' && rawEntities.query.trim()) {
    entities.query = rawEntities.query.trim().slice(0, 80);
  }
  if (typeof rawEntities.category === 'string' && VALID_CATEGORIES.has(rawEntities.category as Product['category'])) {
    entities.category = rawEntities.category as Product['category'];
  }
  if (typeof rawEntities.maxPrice === 'number' && Number.isFinite(rawEntities.maxPrice) && rawEntities.maxPrice > 0) {
    entities.maxPrice = Math.round(rawEntities.maxPrice);
  }
  if (typeof rawEntities.minPrice === 'number' && Number.isFinite(rawEntities.minPrice) && rawEntities.minPrice >= 0) {
    entities.minPrice = Math.round(rawEntities.minPrice);
  }
  if (typeof rawEntities.color === 'string' && rawEntities.color.trim()) {
    entities.color = rawEntities.color.trim().slice(0, 32);
  }
  if (typeof rawEntities.variant === 'string' && rawEntities.variant.trim()) {
    entities.variant = rawEntities.variant.trim().slice(0, 40);
  }
  if (typeof rawEntities.quantity === 'number' && Number.isFinite(rawEntities.quantity)) {
    entities.quantity = Math.max(1, Math.min(10, Math.round(rawEntities.quantity)));
  }
  if (typeof rawEntities.question === 'string' && rawEntities.question.trim()) {
    entities.question = rawEntities.question.trim().slice(0, 160);
  }
  if (typeof rawEntities.occasion === 'string' && rawEntities.occasion.trim()) {
    entities.occasion = rawEntities.occasion.trim().slice(0, 120);
  }
  if (typeof rawEntities.reason === 'string' && rawEntities.reason.trim()) {
    entities.reason = rawEntities.reason.trim().slice(0, 120);
  }
  if (typeof rawEntities.lang === 'string' && VALID_LANGS.has(rawEntities.lang as LangCode)) {
    entities.lang = rawEntities.lang as LangCode;
  }

  const singleRef = sanitizeRef(rawEntities.productRef);
  if (singleRef) entities.productRef = singleRef;

  if (Array.isArray(rawEntities.productRefs)) {
    const refs = rawEntities.productRefs
      .map(sanitizeRef)
      .filter((r): r is ProductRef => Boolean(r));
    if (refs.length > 0) entities.productRefs = refs;
  }

  const replyHint =
    typeof record.replyHint === 'string' && record.replyHint.trim()
      ? record.replyHint.trim().slice(0, 220)
      : typeof record.reply_hint === 'string' && record.reply_hint.trim()
        ? record.reply_hint.trim().slice(0, 220)
        : undefined;

  return {
    parsed: { intent, confidence, entities },
    replyHint,
  };
}
