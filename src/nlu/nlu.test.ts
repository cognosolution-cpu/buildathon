import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNumberWords } from './numberWords';
import { ruleParse } from './ruleParser';
import { CATALOG, searchCatalog } from '../data/catalog';
import { buildComparison } from './compareLogic';
import { t } from './i18n';
import { validateParsedIntent } from './intentValidator';

test('parseNumberWords handles digits, k-shorthand, English, Hindi, and Kannada words', () => {
  assert.equal(parseNumberWords('2000'), 2000);
  assert.equal(parseNumberWords('2,500'), 2500);
  assert.equal(parseNumberWords('2k'), 2000);
  assert.equal(parseNumberWords('3.5k'), 3500);
  assert.equal(parseNumberWords('two thousand'), 2000);
  assert.equal(parseNumberWords('fifteen hundred'), 1500);
  assert.equal(parseNumberWords('दो हज़ार'), 2000);
  assert.equal(parseNumberWords('ಎರಡು ಸಾವಿರ'), 2000);
});

test('ruleParse identifies SEARCH_PRODUCTS with query and maxPrice', () => {
  const res = ruleParse('Show me wireless earbuds under 2000');
  assert.equal(res.intent, 'SEARCH_PRODUCTS');
  assert.equal(res.entities.maxPrice, 2000);
  assert.equal(res.entities.category, 'audio');
  assert.ok(res.confidence >= 0.8);

  const resWords = ruleParse('Find running shoes under three thousand rupees');
  assert.equal(resWords.intent, 'SEARCH_PRODUCTS');
  assert.equal(resWords.entities.maxPrice, 3000);
  assert.equal(resWords.entities.category, 'footwear');
});

test('ruleParse identifies ADD_TO_CART with ordinal and color variant', () => {
  const res = ruleParse('Add the second one to my cart');
  assert.equal(res.intent, 'ADD_TO_CART');
  assert.deepEqual(res.entities.productRef, { index: 2 });

  const colorAdd = ruleParse('Add this in black');
  assert.equal(colorAdd.intent, 'ADD_TO_CART');
  assert.deepEqual(colorAdd.entities.productRef, { this: true });
  assert.equal(colorAdd.entities.variant, 'black');
});

test('ruleParse handles COMPARE, ASK_PRODUCT, CHECKOUT, TRACK_ORDER, RETURN_ITEM, and languages', () => {
  const cmp = ruleParse('Compare 1 and 2');
  assert.equal(cmp.intent, 'COMPARE');
  assert.equal(cmp.entities.productRefs?.length, 2);

  const ask = ruleParse('Tell me more about the second one');
  assert.equal(ask.intent, 'ASK_PRODUCT');
  assert.deepEqual(ask.entities.productRef, { index: 2 });

  assert.equal(ruleParse('Checkout').intent, 'CHECKOUT');
  assert.equal(ruleParse('Where is my order?').intent, 'TRACK_ORDER');
  assert.equal(ruleParse('What is in my cart?').intent, 'SHOW_CART');
  assert.equal(ruleParse('Return the earbuds, wrong size').intent, 'RETURN_ITEM');

  const hiSwitch = ruleParse('हिन्दी में बोलो');
  assert.equal(hiSwitch.intent, 'CHANGE_LANGUAGE');
  assert.equal(hiSwitch.entities.lang, 'hi-IN');

  assert.equal(ruleParse('मेरा कार्ट दिखाओ').intent, 'SHOW_CART');
});

test('searchCatalog filters accurately by query, category, and maxPrice', () => {
  const earbudsUnder2000 = searchCatalog({ query: 'wireless earbuds', maxPrice: 2000 });
  assert.ok(earbudsUnder2000.length >= 1);
  assert.ok(earbudsUnder2000.every((p) => p.price <= 2000));

  const earbudsUnder3000 = searchCatalog({ query: 'earbuds', maxPrice: 3000 });
  assert.equal(earbudsUnder3000.length, 2);
});

test('buildComparison computes winners and deterministic verdict', () => {
  const cmp = buildComparison([CATALOG[0], CATALOG[1]]);
  assert.ok(cmp !== null);
  assert.equal(cmp.bestValueId, CATALOG[0].id);
  assert.equal(cmp.bestRatedId, CATALOG[1].id);
  assert.ok(cmp.verdict.includes('Best value'));
  assert.ok(cmp.rows.length >= 4);
});

test('i18n templates substitute variables across languages', () => {
  assert.equal(
    t('en-IN', 'addedReply', { title: 'PulseBuds Air ANC' }),
    'Added PulseBuds Air ANC to your cart.'
  );
  assert.ok(t('hi-IN', 'addedReply', { title: 'PulseBuds' }).includes('PulseBuds'));
});

test('validateParsedIntent sanitizes LLM outputs and rejects invalid intents/quantities', () => {
  const valid = validateParsedIntent({
    intent: 'SEARCH_PRODUCTS',
    confidence: 0.91,
    replyHint: 'Showing top wireless gear under ₹3,000.',
    entities: {
      query: 'running earbuds',
      category: 'audio',
      maxPrice: 3000.4,
      quantity: 99,
      productRef: { index: 2 },
    },
  });
  assert.equal(valid.parsed.intent, 'SEARCH_PRODUCTS');
  assert.equal(valid.parsed.entities.maxPrice, 3000);
  assert.equal(valid.parsed.entities.quantity, 10);
  assert.deepEqual(valid.parsed.entities.productRef, { index: 2 });
  assert.equal(valid.replyHint, 'Showing top wireless gear under ₹3,000.');

  const invalid = validateParsedIntent({
    intent: 'DROP_DATABASE',
    confidence: 2.5,
    entities: { category: 'unknown_cat', maxPrice: -50, quantity: 0 },
  });
  assert.equal(invalid.parsed.intent, 'UNKNOWN');
  assert.equal(invalid.parsed.confidence, 1);
  assert.equal(invalid.parsed.entities.category, undefined);
  assert.equal(invalid.parsed.entities.maxPrice, undefined);
  assert.equal(invalid.parsed.entities.quantity, 1);
});
