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

import { resolveMurfVoice } from '../voice/murfVoices';

test('resolveMurfVoice maps Indian languages and genders to Murf Falcon 2 voices', () => {
  assert.equal(resolveMurfVoice('en-IN', 'female').voiceId, 'Anisha');
  assert.equal(resolveMurfVoice('en-IN', 'male').voiceId, 'Abhinav');
  assert.equal(resolveMurfVoice('hi-IN', 'female').voiceId, 'Pooja');
  assert.equal(resolveMurfVoice('hi-IN', 'male').voiceId, 'Prathamesh');
  assert.equal(resolveMurfVoice('ta-IN', 'male').voiceId, 'Karthikeyan');
  assert.equal(resolveMurfVoice('te-IN', 'male').voiceId, 'Samar');
  assert.equal(resolveMurfVoice('kn-IN', 'male').voiceId, 'Harman');
});

test('ruleParse strips punctuation and chains compound add-to-cart + checkout commands', () => {
  const single = ruleParse('Add PulseBuds Air ANC back to my cart.');
  assert.equal(single.intent, 'ADD_TO_CART');
  assert.equal(single.entities.productRef?.name, 'PulseBuds Air ANC');

  const compound = ruleParse('Add PulseBuds Air ANC to my cart and redirect to checkout.');
  assert.equal(compound.intent, 'ADD_TO_CART');
  assert.equal(compound.entities.productRef?.name, 'PulseBuds Air ANC');
  assert.equal(compound.followUpActions?.[0]?.intent, 'CHECKOUT');

  const navProfile = ruleParse('Open profile');
  assert.equal(navProfile.intent, 'NAVIGATE');
  assert.equal(navProfile.entities.targetRoute, 'profile');
});

test('ruleParse and validateParsedIntent handle checkout field filling and chained actions', () => {
  const fill = ruleParse(
    'My name is Piyush Sharma, phone 9876543210, address 42 MG Road Indiranagar, city Bengaluru, state Karnataka, pincode 560038'
  );
  assert.equal(fill.intent, 'FILL_CHECKOUT');
  assert.equal(fill.entities.checkoutFields?.name, 'Piyush Sharma');
  assert.equal(fill.entities.checkoutFields?.phone, '9876543210');
  assert.equal(fill.entities.checkoutFields?.line1, '42 MG Road Indiranagar');
  assert.equal(fill.entities.checkoutFields?.city, 'Bengaluru');
  assert.equal(fill.entities.checkoutFields?.state, 'Karnataka');
  assert.equal(fill.entities.checkoutFields?.pincode, '560038');

  const validated = validateParsedIntent({
    intent: 'FILL_CHECKOUT',
    confidence: 0.95,
    entities: {
      checkoutFields: { name: 'Piyush', phone: '+91 9876543210', pincode: '560038' },
      payMethod: 'upi',
      upiId: 'piyush@okaxis',
      submitPayment: true,
    },
    followUpActions: [{ intent: 'CHECKOUT', entities: {} }],
  });
  assert.equal(validated.parsed.intent, 'FILL_CHECKOUT');
  assert.equal(validated.parsed.entities.checkoutFields?.phone, '9876543210');
  assert.equal(validated.parsed.entities.payMethod, 'upi');
  assert.equal(validated.parsed.entities.submitPayment, true);
  assert.equal(validated.parsed.followUpActions?.[0]?.intent, 'CHECKOUT');
});

test('new distinct product categories and searchCatalog work accurately', () => {
  assert.equal(ruleParse('Show 4k action camera under 10000').entities.category, 'cameras');
  assert.equal(ruleParse('Find smart glasses').entities.category, 'eyewear');
  assert.equal(ruleParse('Show magsafe power bank').entities.category, 'accessories');

  const cams = searchCatalog({ category: 'cameras' });
  assert.ok(cams.some((p) => p.id === 'vc-camera-pocket'));
  const eyewear = searchCatalog({ category: 'eyewear' });
  assert.ok(eyewear.some((p) => p.id === 'vc-glasses-spectra'));
  const carry = searchCatalog({ category: 'accessories' });
  assert.ok(carry.length >= 2);
});

test('ruleParse and validateParsedIntent handle SAVE_ADDRESS, UPDATE_PROFILE, and TOGGLE_SIMPLE_VIEW', () => {
  const saveAddr = ruleParse(
    'Save my delivery address: name Aarav Sharma, phone 9876543210, address 42 MG Road, city Bengaluru, state Karnataka, pincode 560038'
  );
  assert.equal(saveAddr.intent, 'SAVE_ADDRESS');
  assert.equal(saveAddr.entities.saveAddress, true);
  assert.equal(saveAddr.entities.checkoutFields?.name, 'Aarav Sharma');
  assert.equal(saveAddr.entities.checkoutFields?.line1, '42 MG Road');
  assert.equal(saveAddr.entities.checkoutFields?.city, 'Bengaluru');
  assert.equal(saveAddr.entities.checkoutFields?.pincode, '560038');

  const updateProf = ruleParse('Update my profile name Piyush Sharma and phone 9876543210');
  assert.equal(updateProf.intent, 'UPDATE_PROFILE');
  assert.equal(updateProf.entities.profileFields?.fullName, 'Piyush Sharma');
  assert.equal(updateProf.entities.profileFields?.phone, '9876543210');

  const toggle2D = ruleParse('Turn on simple view 2D studio photos');
  assert.equal(toggle2D.intent, 'TOGGLE_SIMPLE_VIEW');
  assert.equal(toggle2D.entities.simpleView, true);

  const toggle3D = ruleParse('Switch to 3D view');
  assert.equal(toggle3D.intent, 'TOGGLE_SIMPLE_VIEW');
  assert.equal(toggle3D.entities.simpleView, false);

  const validated = validateParsedIntent({
    intent: 'SAVE_ADDRESS',
    confidence: 0.94,
    entities: {
      saveAddress: true,
      checkoutFields: { name: 'Aarav', phone: '+91 9876543210', line1: '42 MG Road', city: 'Bengaluru', pincode: '560038' },
      profileFields: { fullName: 'Aarav Sharma', phone: '+91 9876543210' },
      simpleView: true,
    },
  });
  assert.equal(validated.parsed.intent, 'SAVE_ADDRESS');
  assert.equal(validated.parsed.entities.saveAddress, true);
  assert.equal(validated.parsed.entities.profileFields?.phone, '9876543210');
  assert.equal(validated.parsed.entities.simpleView, true);
});

test('resolveMurfVoice supports Piyush cloned voice (Falcon 2.1)', () => {
  const enCloned = resolveMurfVoice('en-IN', 'cloned');
  assert.equal(enCloned.voiceId, 'cln_0179511856605450I_0179524244970937N');
  assert.equal(enCloned.model, 'falcon-2.1');
  assert.equal(enCloned.channelType, 'MONO');
  assert.equal(resolveMurfVoice('hi-IN', 'cloned').voiceId, 'cln_0179511856605450I_0179524244970937N');
});

test('ruleParse handles full and selective 3D product view requests accurately', () => {
  const full3d = ruleParse('show me the full product in 3d view');
  assert.equal(full3d.intent, 'ASK_PRODUCT');
  assert.equal(full3d.entities.simpleView, false);
  assert.deepEqual(full3d.entities.productRef, { this: true });

  const selectiveOrdinal = ruleParse('show me the second product in 3d view');
  assert.equal(selectiveOrdinal.intent, 'ASK_PRODUCT');
  assert.equal(selectiveOrdinal.entities.simpleView, false);
  assert.deepEqual(selectiveOrdinal.entities.productRef, { index: 2 });

  const selectiveNamed = ruleParse('open PulseBuds Air ANC in 3D view');
  assert.equal(selectiveNamed.intent, 'ASK_PRODUCT');
  assert.equal(selectiveNamed.entities.simpleView, false);
  assert.equal(selectiveNamed.entities.productRef?.name, 'PulseBuds Air ANC');
});

test('expanded catalog includes gaming, workspace, fitness, and travel categories', () => {
  assert.equal(CATALOG.length, 30);
  assert.equal(ruleParse('Show hall effect gamepad controller').entities.category, 'gaming');
  assert.equal(ruleParse('Find thunderbolt desk dock').entities.category, 'workspace');
  assert.equal(ruleParse('Show massage gun for recovery').entities.category, 'fitness');
  assert.equal(ruleParse('Find 140w gan charger for travel').entities.category, 'travel');

  assert.ok(searchCatalog({ category: 'gaming' }).length >= 2);
  assert.ok(searchCatalog({ category: 'workspace' }).length >= 2);
  assert.ok(searchCatalog({ category: 'fitness' }).length >= 2);
  assert.ok(searchCatalog({ category: 'travel' }).length >= 2);
});

test('ruleParse distinguishes exact ADD_TO_CART quantity from product index and model numbers', () => {
  const onlyOne = ruleParse('Add only one');
  assert.equal(onlyOne.intent, 'ADD_TO_CART');
  assert.equal(onlyOne.entities.quantity, 1);
  assert.deepEqual(onlyOne.entities.productRef, { this: true });

  const oneNamed = ruleParse('Add only one PulseBuds Air ANC');
  assert.equal(oneNamed.intent, 'ADD_TO_CART');
  assert.equal(oneNamed.entities.quantity, 1);
  assert.equal(oneNamed.entities.productRef?.name, 'PulseBuds Air ANC');

  const twoWordsNamed = ruleParse('Add two PulseBuds Air ANC to my cart');
  assert.equal(twoWordsNamed.intent, 'ADD_TO_CART');
  assert.equal(twoWordsNamed.entities.quantity, 2);
  assert.equal(twoWordsNamed.entities.productRef?.name, 'PulseBuds Air ANC');

  const threeOfSecond = ruleParse('Add 3 of the second one');
  assert.equal(threeOfSecond.intent, 'ADD_TO_CART');
  assert.equal(threeOfSecond.entities.quantity, 3);
  assert.deepEqual(threeOfSecond.entities.productRef, { index: 2 });

  const itemIndex = ruleParse('Add item 2');
  assert.equal(itemIndex.intent, 'ADD_TO_CART');
  assert.equal(itemIndex.entities.quantity, 1);
  assert.deepEqual(itemIndex.entities.productRef, { index: 2 });

  const modelWithDigit = ruleParse('Add StrideLab Tempo Knit 2');
  assert.equal(modelWithDigit.intent, 'ADD_TO_CART');
  assert.equal(modelWithDigit.entities.quantity, 1);
  assert.equal(modelWithDigit.entities.productRef?.name, 'StrideLab Tempo Knit 2');

  const model140w = ruleParse('Add VoltCore 140W GaN Travel Brick');
  assert.equal(model140w.intent, 'ADD_TO_CART');
  assert.equal(model140w.entities.quantity, 1);
  assert.equal(model140w.entities.productRef?.name, 'VoltCore 140W GaN Travel Brick');

  const complaint = ruleParse('Why did you add 23 items? I said only one');
  assert.notEqual(complaint.intent, 'ADD_TO_CART');
});

