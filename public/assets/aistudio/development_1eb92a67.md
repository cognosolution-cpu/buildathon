# VibeCart: Shop by Talking — Development Guide

> Full-stack, **₹0 budget** build. The frontend is **plain HTML + CSS + JavaScript (ES modules)** with no framework and no build step. Voice assistant + product discovery + 3D cart + Razorpay (test mode) checkout + order tracking + returns. Minimal tooling, but a clean, layered architecture.

Visual design lives in `design.md` (black and orange theme, logo, screens). This file covers how to build it.

---

## 1. Goal and Core Challenge

Build a voice-driven shopping assistant where a user can **discover products, get recommendations, take a real shopping action (add to cart), and complete a payment**, all by talking.

The core challenge is the full loop: **speech → intent → action → UI update → spoken reply.** Everything in this document serves that loop.

---

## 2. The ₹0 Stack (What We Use and Why)

| Layer | Choice | Cost | Notes |
|---|---|---|---|
| Frontend | **HTML5 + CSS3 + vanilla JavaScript (ES modules)** | Free | Open `index.html` through any static server. No npm needed |
| Styling | **Plain CSS with custom properties** (tokens from `design.md`) | Free | `tokens.css` holds colors, blur, gradients |
| Icons | **Lucide** via CDN | Free | Same icon set as the design |
| Fonts | **Google Fonts** (Sora, Inter, Noto Sans Indic) | Free | |
| 3D | **Three.js** via CDN importmap (+ `OrbitControls`, `GLTFLoader`, `DRACOLoader`) | Free | Product viewer + 3D cart |
| State | **Tiny pub/sub store** (about 20 lines, in `store.js`) | Free | Cart, voice, session |
| Routing | **Hash router** (`#/product/123`) | Free | Works on any static host |
| Animation | **CSS keyframes + Web Animations API** (optional GSAP from CDN) | Free | |
| Database / Auth / API | **Supabase** (Postgres, Auth, Edge Functions, Realtime) via `supabase-js` from CDN | Free tier | No credit card needed |
| Speech-to-Text (STT) | **Web Speech API** (`SpeechRecognition`) | Free, no key | Chrome/Edge best; supports `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`, `te-IN` |
| Text-to-Speech (TTS) | **Web Speech API** (`speechSynthesis`) | Free, no key | Uses device voices |
| STT fallback (offline) | **Transformers.js + Whisper-tiny (WASM)** from CDN | Free | For Firefox/Safari, stretch goal |
| Intent / NLU | **Hybrid: rule-based parser + free LLM fallback** | Free | See Section 5 |
| Free LLM (optional) | **Groq free tier** (Llama 3), **Google Gemini free tier**, or **OpenRouter `:free` models** | Free, key needed | Key is free, no card. Called only from an Edge Function |
| Search | **Postgres full-text + `pg_trgm`** (+ optional `pgvector`) | Free | Inside Supabase |
| Payments | **Razorpay Test Mode** | Free | No real money moves. Needs free test keys |
| Product data | **DummyJSON** seed (or hand-made JSON) | Free | Seeded into Supabase |
| 3D models | **Poly Pizza, Kenney, Sketchfab (CC0/CC-BY)**, or procedural primitives | Free | Keep < 500 KB each |
| Hosting | **GitHub Pages / Netlify / Vercel / Cloudflare Pages** (static) | Free | Frontend is just static files |

### Honest notes on "free"
- **Web Speech API** in Chrome sends audio to Google's servers for recognition. It's free and keyless, but not offline and not private. Mention this in the app's privacy note.
- **Firefox does not support `SpeechRecognition`**; Safari support is partial. Hence the always-available text input and the optional Whisper-WASM fallback.
- **LLM free tiers have rate limits.** That's why the app works **without any LLM** (rules first) and uses the LLM only when rules fail.
- **Razorpay test mode is fully free**, but you must create a Razorpay account to get test keys (no payment needed, no KYC for test mode).
- **Shipping:** Razorpay handles **payments**, not shipping. Shipping is **simulated**: an order status state machine in Supabase (Placed → Packed → Shipped → Out for delivery → Delivered) advanced by a scheduled function. Real shipping would need an aggregator such as Shiprocket, which is out of scope.
- **No framework means no build step**, so ES modules load directly in the browser. You must serve files over `http://` (for example `npx serve` or VS Code Live Server). Opening `index.html` with `file://` will block modules and the microphone.

---

## 3. System Architecture

```
┌──────────────────── Browser (HTML + CSS + vanilla JS modules) ────────────────────┐
│                                                                                   │
│  Mic ──▶ STT (Web Speech / Whisper-WASM) ──▶ Transcript                           │
│                                      │                                            │
│                                      ▼                                            │
│                         ┌──────────────────────────┐                              │
│                         │   Intent Router (NLU)    │                              │
│                         │ 1. Rule/regex + fuzzy    │                              │
│                         │ 2. LLM fallback (free)   │                              │
│                         └────────────┬─────────────┘                              │
│                                      ▼  { intent, entities, confidence }          │
│                         ┌──────────────────────────┐                              │
│                         │     Action Executor      │  (tool functions)            │
│                         │ search / add / remove /  │                              │
│                         │ compare / checkout /     │                              │
│                         │ track / return           │                              │
│                         └──────┬───────────┬───────┘                              │
│                                │           │                                      │
│                       store.js (pub/sub)   Supabase client                        │
│                                │           │                                      │
│            DOM renderers (ui/*.js) + Three.js (3D cart / product viewer)          │
│                                │                                                  │
│                  TTS (speechSynthesis) ◀── reply text                             │
└────────────────────────────────┼───────────┼──────────────────────────────────────┘
                                 │           │
                                 ▼           ▼
                     ┌────────────────────────────────────┐
                     │              Supabase              │
                     │ Postgres + RLS │ Auth │ Realtime   │
                     │ Edge Functions:                    │
                     │  • create-razorpay-order           │
                     │  • verify-payment                  │
                     │  • llm-proxy (hides LLM key)       │
                     │  • advance-order-status (cron)     │
                     └──────────────┬─────────────────────┘
                                    ▼
                            Razorpay (Test Mode)
```

### The voice loop (every turn)
1. **Listen:** STT produces a transcript (interim + final).
2. **Understand:** Intent Router returns `{ intent, entities, confidence }`.
3. **Act:** Action Executor calls a validated tool function (DB query, cart mutation, etc.).
4. **Show:** the UI re-renders (results list, 3D cart drop animation, action chip).
5. **Speak:** a short reply is synthesized via TTS; the mic re-opens if "auto-listen" is on.

### Design principle: *the LLM never touches the database directly.*
The LLM (or the rules) only **chooses a tool and arguments**. Our code validates the arguments and executes. This keeps the system safe, testable, and working even if the LLM is down.

---

## 4. Repository Structure

```
vibecart/
├── index.html                  # single page, all screens are <section data-route="...">
├── README.md
├── design.md
├── development.md
├── css/
│   ├── tokens.css              # colors, gradients, blur, radii, fonts (from design.md)
│   ├── base.css                # reset, background glow, grain, typography
│   ├── components.css          # header, orb, chips, cards, buttons, sheets, toasts
│   ├── screens.css             # per-screen layout
│   └── animations.css          # orb pulse, add-to-cart arc, fades
├── js/
│   ├── main.js                 # boot: auth, router, voice, first render
│   ├── config.js               # SUPABASE_URL, SUPABASE_ANON_KEY, RAZORPAY_KEY_ID (all public)
│   ├── router.js               # hash router
│   ├── store.js                # pub/sub store: cart, session, voice
│   ├── i18n.js                 # t("key"), setLang()
│   ├── voice/
│   │   ├── recognition.js      # SpeechRecognition wrapper
│   │   ├── synthesis.js        # speak()
│   │   └── whisperFallback.js  # stretch goal
│   ├── nlu/
│   │   ├── ruleParser.js       # regex/fuzzy parser (multi-language)
│   │   ├── llmParser.js        # calls llm-proxy edge function
│   │   ├── router.js           # rules → LLM fallback
│   │   └── numberWords.js      # "two thousand", "दो हज़ार", "ಎರಡು ಸಾವಿರ"
│   ├── actions/                # tool functions
│   │   ├── index.js            # registry + validation + execute()
│   │   ├── searchProducts.js
│   │   ├── addToCart.js
│   │   ├── removeFromCart.js
│   │   ├── compareProducts.js
│   │   ├── startCheckout.js
│   │   ├── trackOrder.js
│   │   └── initiateReturn.js
│   ├── ui/                     # DOM renderers
│   │   ├── header.js  voiceOrb.js  voiceOverlay.js  actionChips.js
│   │   ├── productCard.js  results.js  productDetail.js  compare.js
│   │   ├── cart.js  checkout.js  orders.js  returns.js  toast.js
│   ├── three/
│   │   ├── productViewer.js    # THREE_CANVAS_PRODUCT
│   │   └── cart3d.js           # THREE_CANVAS_CART
│   └── lib/
│       ├── supabase.js
│       └── razorpay.js
├── locales/                    # en.json, hi.json, kn.json, ta.json, te.json
├── assets/
│   ├── logo.svg                # from design.md section 3.0 (also the favicon)
│   └── models/                 # .glb files (compressed)
├── supabase/
│   ├── migrations/001_init.sql
│   ├── seed.sql
│   └── functions/
│       ├── create-razorpay-order/index.ts
│       ├── verify-payment/index.ts
│       ├── llm-proxy/index.ts
│       └── advance-order-status/index.ts
└── scripts/
    └── seed-products.js        # Node script: DummyJSON → Supabase
```

### `index.html` skeleton

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VibeCart: Shop by Talking</title>
  <link rel="icon" href="assets/logo.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/components.css" />
  <link rel="stylesheet" href="css/screens.css" />
  <link rel="stylesheet" href="css/animations.css" />

  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
      "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
    }
  }
  </script>
</head>
<body>
  <header class="app-header">
    <a href="#/" class="brand"><img src="assets/logo.svg" alt="" width="32" height="32" /><span>Vibe<b>Cart</b></span></a>
    <div class="header-actions">
      <button id="lang-btn" aria-label="Language"><i data-lucide="globe"></i></button>
      <a href="#/cart" id="cart-btn" aria-label="Cart"><i data-lucide="shopping-cart"></i><span id="cart-count" class="badge">0</span></a>
    </div>
  </header>

  <main id="app">
    <section data-route="home"></section>
    <section data-route="results"></section>
    <section data-route="product"></section>
    <section data-route="compare"></section>
    <section data-route="cart"></section>
    <section data-route="checkout"></section>
    <section data-route="orders"></section>
    <section data-route="profile"></section>
  </main>

  <div id="action-chips" aria-live="polite"></div>
  <div id="voice-overlay" hidden></div>
  <button id="voice-orb" aria-label="Talk to VibeCart"></button>
  <nav class="bottom-nav"><!-- Home, Explore, Orders, Profile --></nav>

  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

### `css/tokens.css` (from `design.md`)

```css
:root {
  --bg-base: #050505;   --bg-surface: #111111;  --bg-glass: rgba(255,255,255,.06);
  --primary: #FF6A00;   --primary-glow: #FFA040; --primary-deep: #E34A00;
  --primary-fade: rgba(255,106,0,.15);
  --white: #fff;        --text: #F5F5F5;  --text-2: #9A9A9A;
  --accent: #2EE59D;    --info: #4DA3FF;  --gold: #FFC83D;  --danger: #FF4D5E;
  --border: rgba(255,255,255,.10);

  --grad-orange: linear-gradient(135deg, #FFA040 0%, #FF6A00 55%, #E34A00 100%);
  --grad-fade:   linear-gradient(180deg, rgba(255,106,0,.35), rgba(255,106,0,0) 100%);
  --glow: 0 8px 40px rgba(255,106,0,.30);

  --r-card: 20px; --r-btn: 14px; --r-sheet: 28px;
  --font-head: "Sora", "Noto Sans Devanagari", "Noto Sans Kannada", sans-serif;
  --font-body: "Inter", "Noto Sans Devanagari", "Noto Sans Kannada", sans-serif;
}
```
The page background, fading header and glass-panel rules are in `design.md` Section 2.1; paste them into `base.css` and `components.css`.

---

## 5. Voice and NLU Design (the heart of the project)

### 5.1 Speech-to-Text

```js
// js/voice/recognition.js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const sttSupported = !!SR;

export function createRecognizer({ lang = "en-IN", onInterim, onFinal, onStart, onEnd, onError }) {
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;

  rec.onstart = () => onStart?.();
  rec.onend = () => onEnd?.();
  rec.onerror = (e) => onError?.(e.error);          // "not-allowed", "no-speech", ...
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript;
      if (e.results[i].isFinal) onFinal?.(text.trim());
      else interim += text;
    }
    if (interim) onInterim?.(interim);
  };
  return {
    start: () => { try { rec.start(); } catch {} },   // throws if already started
    stop: () => rec.stop(),
    setLang: (l) => (rec.lang = l),
  };
}
```

Supported language codes: `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`, `te-IN`.

### 5.2 Text-to-Speech

```js
// js/voice/synthesis.js
export function speak(text, lang = "en-IN") {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.0;
  const voice = speechSynthesis.getVoices().find((v) => v.lang === lang);
  if (voice) u.voice = voice;
  speechSynthesis.cancel();          // barge-in friendly
  speechSynthesis.speak(u);
}
```
> Voice availability varies by device. If no voice exists for a language, show text only and fall back to `en-IN`. Call `speechSynthesis.getVoices()` once after the `voiceschanged` event.

### 5.3 The store (replaces a state library)

```js
// js/store.js
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

export const store = createStore({
  lang: "en-IN",
  screen: "home",
  voiceStatus: "idle",            // idle | listening | thinking | speaking | error
  transcript: "",
  lastResults: [],                // numbered 1..N for voice references
  focusedProductId: null,         // "this" / "it"
  cart: [],                       // [{ product, quantity, variant }]
  pendingConfirmation: null,      // { type: "CHECKOUT" | "RETURN" | "CLEAR_CART", payload }
  chips: [],
});
```
`CONFIRM` / `DENY` only mean something when `pendingConfirmation` is set.

### 5.4 Intent Catalogue

| Intent | Example utterances | Entities |
|---|---|---|
| `SEARCH_PRODUCTS` | "show me running shoes under 3000" | `query`, `category`, `maxPrice`, `minPrice`, `color`, `brand` |
| `RECOMMEND` | "gift for my mom", "best budget phone" | `occasion`, `budget`, `recipient` |
| `ASK_PRODUCT` | "is it waterproof?" | `productRef`, `question` |
| `ADD_TO_CART` | "add the second one", "add this in black" | `productRef` (index/id/"this"), `quantity`, `variant` |
| `REMOVE_FROM_CART` | "remove the headphones" | `productRef` |
| `UPDATE_QUANTITY` | "make it 3" | `productRef`, `quantity` |
| `COMPARE` | "compare 1 and 3" | `productRefs[]` |
| `SHOW_CART` | "what's in my cart" | none |
| `CHECKOUT` | "checkout", "pay now" | none |
| `CONFIRM` / `DENY` | "yes", "no, change address" | none |
| `TRACK_ORDER` | "where is my order" | `orderRef` (latest by default) |
| `RETURN_ITEM` | "I want to return the shoes" | `productRef`, `reason` |
| `CHANGE_LANGUAGE` | "speak in Hindi" | `lang` |
| `HELP` / `UNKNOWN` | | |

### 5.5 Hybrid NLU: Rules first, LLM second

```
transcript
   │
   ├─▶ ruleParse (regex + fuzzy + number words, per-language keywords)
   │       confidence ≥ 0.75 ? ──▶ use it  (0 ms, 0 tokens, works offline)
   │
   └─▶ else llmParse (Groq / Gemini free tier via llm-proxy Edge Function)
           validated ──▶ if invalid → UNKNOWN + suggested prompts
```

**Why hybrid?** Rules cover most shopping commands instantly and never hit rate limits. The LLM handles messy or mixed-language phrasing ("yaar ek accha sa gift batao mummy ke liye").

**Rule parser sketch**

```js
// js/nlu/ruleParser.js
import { parseNumberWords } from "./numberWords.js";

const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  "1st": 1, "2nd": 2, "3rd": 3, one: 1, two: 2, three: 3,
  // hi: "पहला": 1, "दूसरा": 2 ...   kn: "ಮೊದಲ": 1, ...
};

export function ruleParse(text) {
  const t = text.toLowerCase().trim();

  const add = t.match(/\b(add|put|buy)\b.*?\b(first|second|third|fourth|fifth|number\s*(\d)|\d)\b/);
  if (add) {
    const index = ORDINALS[add[2]] ?? Number(add[3] ?? add[2]);
    return { intent: "ADD_TO_CART", entities: { productRef: { index } }, confidence: 0.9 };
  }

  if (/\b(checkout|pay now|proceed to pay|payment)\b/.test(t))
    return { intent: "CHECKOUT", entities: {}, confidence: 0.95 };

  if (/\b(where is my order|track|order status)\b/.test(t))
    return { intent: "TRACK_ORDER", entities: {}, confidence: 0.9 };

  if (/\b(yes|yeah|confirm|go ahead|haan)\b/.test(t))
    return { intent: "CONFIRM", entities: {}, confidence: 0.9 };

  const price = t.match(/\b(?:under|below|less than|within)\s+([\w\s,]+?)(?:\s*(?:rupees|rs|₹))?$/);
  const maxPrice = price ? parseNumberWords(price[1]) : undefined;

  if (/\b(show|find|search|looking for|i want|i need)\b/.test(t)) {
    const query = t
      .replace(/\b(show me|find me|find|search for|looking for|i want|i need)\b/g, "")
      .replace(/\b(under|below|less than|within)\b.*$/, "")
      .trim();
    return { intent: "SEARCH_PRODUCTS", entities: { query, maxPrice }, confidence: 0.8 };
  }
  return { intent: "UNKNOWN", entities: {}, confidence: 0 };
}
```

```js
// js/nlu/router.js
import { ruleParse } from "./ruleParser.js";
import { llmParse } from "./llmParser.js";

export async function understand(transcript, session) {
  const r = ruleParse(transcript);
  if (r.confidence >= 0.75) return r;
  try {
    return await llmParse(transcript, session);   // may throw / rate-limit
  } catch {
    return { intent: "UNKNOWN", entities: {}, confidence: 0 };
  }
}
```

**LLM system prompt (used inside `llm-proxy`)**

```
You are the intent parser for a shopping assistant. Return ONLY valid JSON:
{"intent": "<one of the intent list>", "entities": {...}, "reply_language": "en|hi|kn|ta|te"}
Rules:
- Never invent products or prices. Only extract what the user said.
- The user may speak Hindi, Kannada, Tamil, Telugu, English or a mix.
- Convert spoken numbers to digits (e.g., "two thousand" → 2000).
- productRef: use {"index": N} for "second one", {"id": "..."} if given, {"this": true} for "this/it".
Context: current screen = {{screen}}, visible product ids = {{ids}}, cart count = {{n}}.
```
Passing the **screen context** (which results are visible and numbered) is what makes "add the second one" work.

### 5.6 Recommendations (no ML infrastructure needed)
- **Rule-based:** filter by `category` and `price range`, order by `rating * log(reviews)`.
- **Content-based (optional):** `pgvector` similarity on product embeddings generated once at seed time.
- **"Also viewed":** same category with the nearest price.
- The assistant explains recommendations with a templated sentence ("Top rated under ₹2,000 with 4.4★"), so no LLM is needed.

### 5.7 Product comparison
The server returns each product's structured `specs` JSON. A pure function computes the "winner per row" and builds a verdict string from templates:
> "Best value: {cheapest with rating > 4}. Best rated: {highest rating}."

Optional: the LLM polishes the verdict in the user's language.

---

## 6. Database (Supabase / Postgres)

### 6.1 Schema

```sql
-- supabase/migrations/001_init.sql
create extension if not exists pg_trgm;
create extension if not exists vector;       -- optional, for semantic search

create table categories (
  id serial primary key,
  slug text unique not null,
  name text not null
);

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id int references categories(id),
  brand text,
  price numeric(10,2) not null,
  mrp numeric(10,2),
  rating numeric(2,1) default 0,
  rating_count int default 0,
  stock int default 0,
  image_url text,
  model_url text,                  -- .glb path for 3D viewer (nullable)
  specs jsonb default '{}',        -- {"battery":"20h","warranty":"1y",...}
  variants jsonb default '[]',     -- [{"color":"black","hex":"#111"}, ...]
  tags text[] default '{}',
  embedding vector(384),           -- optional
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' '))
  ) stored,
  created_at timestamptz default now()
);
create index products_search_idx on products using gin (search);
create index products_title_trgm on products using gin (title gin_trgm_ops);
create index products_price_idx on products (price);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  preferred_lang text default 'en-IN'
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text, phone text, line1 text, city text, state text, pincode text,
  is_default boolean default false
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  status text default 'active'           -- active | converted
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null check (quantity > 0),
  variant jsonb,
  unique (cart_id, product_id, variant)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  address jsonb not null,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) default 0,
  total numeric(10,2) not null,
  status text default 'created',          -- created | paid | packed | shipped | out_for_delivery | delivered | cancelled | returned
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  title text, price numeric(10,2), quantity int, variant jsonb
);

create table order_events (            -- powers the tracking stepper (Realtime)
  id bigserial primary key,
  order_id uuid references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz default now()
);

create table returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  order_item_id uuid references order_items(id),
  reason text,
  status text default 'requested',     -- requested | approved | picked_up | refunded
  created_at timestamptz default now()
);
```

### 6.2 Row Level Security (must-have)

```sql
alter table products enable row level security;
create policy "products readable by all" on products for select using (true);

alter table carts enable row level security;
create policy "own cart" on carts for all using (auth.uid() = user_id);

alter table cart_items enable row level security;
create policy "own cart items" on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

alter table orders enable row level security;
create policy "own orders read" on orders for select using (auth.uid() = user_id);
-- inserts/updates to orders happen ONLY through Edge Functions using the service role key

alter table order_events enable row level security;
create policy "own order events" on order_events for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
```

### 6.3 Search function

```sql
create or replace function search_products(
  q text, max_price numeric default null, min_price numeric default null,
  cat text default null, lim int default 5
) returns setof products language sql stable as $$
  select p.* from products p
  left join categories c on c.id = p.category_id
  where (q is null or q = '' or p.search @@ plainto_tsquery('simple', q) or p.title % q)
    and (max_price is null or p.price <= max_price)
    and (min_price is null or p.price >= min_price)
    and (cat is null or c.slug = cat)
  order by
    (case when q is null or q = '' then 0 else ts_rank(p.search, plainto_tsquery('simple', q)) + similarity(p.title, q) end) desc,
    p.rating desc
  limit lim;
$$;
```
Call from the client: `supabase.rpc("search_products", { q, max_price, lim: 5 })`.

### 6.4 Auth
Use **Supabase Anonymous Sign-ins** (or magic-link/Google) so judges/users can shop instantly without a signup wall, and still get RLS-protected carts and orders.

### 6.5 Seeding
`scripts/seed-products.js` (a small Node script) fetches `https://dummyjson.com/products?limit=100`, maps to our schema (set price in ₹ by multiplying, add `specs` and `variants`), and bulk-inserts. Attach 5–10 `.glb` models to showcase 3D; the rest fall back to images.

---

## 7. Edge Functions (Supabase, Deno)

Set secrets: `supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... GROQ_API_KEY=...`

### 7.1 `create-razorpay-order`

```ts
// supabase/functions/create-razorpay-order/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "")!;
  const { data: { user } } = await supabase.auth.getUser(jwt);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { address } = await req.json();

  // 1. Recompute totals SERVER-SIDE from the DB (never trust client prices)
  const { data: cart } = await supabase.from("carts")
    .select("id, cart_items(quantity, variant, products(id,title,price))")
    .eq("user_id", user.id).eq("status", "active").single();
  const items = cart!.cart_items as any[];
  const subtotal = items.reduce((s, i) => s + i.products.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  // 2. Create Razorpay order (amount in paise)
  const auth = btoa(`${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get("RAZORPAY_KEY_SECRET")}`);
  const rp = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(total * 100), currency: "INR", receipt: `vc_${Date.now()}` }),
  }).then(r => r.json());

  // 3. Persist our order
  const { data: order } = await supabase.from("orders").insert({
    user_id: user.id, address, subtotal, shipping, total,
    status: "created", razorpay_order_id: rp.id,
  }).select().single();

  await supabase.from("order_items").insert(items.map(i => ({
    order_id: order.id, product_id: i.products.id, title: i.products.title,
    price: i.products.price, quantity: i.quantity, variant: i.variant,
  })));

  return Response.json({
    orderId: order.id, razorpayOrderId: rp.id, amount: rp.amount,
    keyId: Deno.env.get("RAZORPAY_KEY_ID"),
  });
});
```

### 7.2 `verify-payment`

```ts
// supabase/functions/verify-payment/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function hmacSha256Hex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  const expected = await hmacSha256Hex(
    Deno.env.get("RAZORPAY_KEY_SECRET")!, `${razorpay_order_id}|${razorpay_payment_id}`);
  if (expected !== razorpay_signature) return new Response("Invalid signature", { status: 400 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order } = await supabase.from("orders")
    .update({ status: "paid", razorpay_payment_id })
    .eq("razorpay_order_id", razorpay_order_id).select().single();

  await supabase.from("order_events").insert({ order_id: order.id, status: "paid", note: "Payment received" });
  await supabase.from("carts").update({ status: "converted" }).eq("user_id", order.user_id).eq("status", "active");
  return Response.json({ ok: true, orderId: order.id });
});
```

### 7.3 `llm-proxy`
Receives `{ transcript, context }`, adds the system prompt from Section 5.4, calls Groq/Gemini with the secret key, requests JSON output, returns parsed JSON. Rate-limit per user (e.g., 20 calls/min) to stay inside the free tier. The browser never sees the LLM key.

### 7.4 `advance-order-status` (simulated shipping)
Scheduled with **pg_cron** (free in Supabase) every few minutes. For demo, moves paid orders forward: `paid → packed → shipped → out_for_delivery → delivered`, inserting rows into `order_events`. The Orders screen subscribes with **Supabase Realtime**, so the tracking stepper animates live during a demo.

---

## 8. Razorpay Integration (Test Mode)

1. Create a Razorpay account → switch to **Test Mode** → **Settings → API Keys → Generate Test Key**.
2. Put `RAZORPAY_KEY_ID` in `js/config.js` (public), `RAZORPAY_KEY_SECRET` **only** in Supabase secrets.
3. The Checkout script is already loaded in `index.html`: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`.

```js
// js/lib/razorpay.js
import { supabase } from "./supabase.js";

export async function payNow(address, onSuccess, onFail) {
  const { data, error } = await supabase.functions.invoke("create-razorpay-order", { body: { address } });
  if (error) return onFail();

  const rzp = new window.Razorpay({
    key: data.keyId,
    amount: data.amount,
    currency: "INR",
    name: "VibeCart",
    description: "Voice order",
    order_id: data.razorpayOrderId,
    prefill: { name: address.name, contact: address.phone },
    theme: { color: "#FF6A00" },                     // matches the orange brand color
    handler: async (resp) => {
      const v = await supabase.functions.invoke("verify-payment", { body: resp });
      v.error ? onFail() : onSuccess(data.orderId);
    },
    modal: { ondismiss: onFail },
  });
  rzp.open();
}
```

**Test credentials:** use Razorpay's test card `4111 1111 1111 1111`, any future expiry, any CVV, any OTP on the mock bank page. (Check Razorpay's docs for current test card/UPI details, since they occasionally change.)

**Security checklist**
- Never compute prices on the client. Totals are recomputed server-side.
- Always verify the payment signature server-side before marking `paid`.
- Keep the key secret in Supabase secrets, never in the repo or the frontend.
- Optional: add a Razorpay webhook (`payment.captured`) as a second confirmation path.

> **Voice + payment safety:** the voice command "pay now" only *opens* the Razorpay modal after a spoken or tapped **explicit confirmation**. The actual card/UPI entry is always done by touch in Razorpay's UI. Voice never handles card details.

---

## 9. Frontend Implementation Notes (Vanilla JS)

### 9.1 Boot sequence (`main.js`)

```js
// js/main.js
import { store } from "./store.js";
import { supabase } from "./lib/supabase.js";
import { initRouter } from "./router.js";
import { initVoiceOrb } from "./ui/voiceOrb.js";
import { initHeader } from "./ui/header.js";
import { loadCart } from "./actions/addToCart.js";
import { setLang } from "./i18n.js";

async function boot() {
  // anonymous sign-in so carts/orders work under RLS without a signup wall
  const { data } = await supabase.auth.getSession();
  if (!data.session) await supabase.auth.signInAnonymously();

  await setLang(store.get().lang);
  await loadCart();
  initHeader();
  initVoiceOrb();
  initRouter();
  window.lucide?.createIcons();
}
boot();
```

```js
// js/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 9.2 The voice orb wires everything together

```js
// js/ui/voiceOrb.js
import { store } from "../store.js";
import { createRecognizer, sttSupported } from "../voice/recognition.js";
import { speak } from "../voice/synthesis.js";
import { understand } from "../nlu/router.js";
import { execute } from "../actions/index.js";
import { showChip } from "./actionChips.js";

export function initVoiceOrb() {
  const orb = document.getElementById("voice-orb");
  const setStatus = (voiceStatus) => { store.set({ voiceStatus }); orb.dataset.state = voiceStatus; };

  const rec = createRecognizer({
    lang: store.get().lang,
    onStart: () => setStatus("listening"),
    onInterim: (t) => store.set({ transcript: t }),
    onFinal: async (t) => {
      store.set({ transcript: t });
      setStatus("thinking");
      const { intent, entities } = await understand(t, store.get());
      const result = await execute(intent, entities, store.get());   // { reply, chip, navigate }
      if (result.chip) showChip(result.chip);
      if (result.navigate) location.hash = result.navigate;
      setStatus("speaking");
      speak(result.reply, store.get().lang);
      setTimeout(() => setStatus("idle"), 800);
    },
    onError: (e) => setStatus("error"),
    onEnd: () => { if (store.get().voiceStatus === "listening") setStatus("idle"); },
  });

  if (!sttSupported) { orb.dataset.state = "error"; orb.title = "Voice not supported in this browser"; return; }
  orb.addEventListener("click", () => (store.get().voiceStatus === "listening" ? rec.stop() : rec.start()));
}
```
`orb.dataset.state` drives the CSS for the five orb states in `design.md` (`#voice-orb[data-state="listening"] { animation: rings 1.4s infinite; }`).

### 9.3 Action Executor pattern

```js
// js/actions/index.js
import { searchProducts } from "./searchProducts.js";
import { addToCart } from "./addToCart.js";
import { removeFromCart } from "./removeFromCart.js";
import { compareProducts } from "./compareProducts.js";
import { startCheckout } from "./startCheckout.js";
import { trackOrder } from "./trackOrder.js";
import { initiateReturn } from "./initiateReturn.js";

// Each tool: a validator (returns cleaned args or throws) + a run() function
const tools = {
  SEARCH_PRODUCTS: {
    validate: (e) => ({
      query: String(e.query ?? "").slice(0, 80),
      maxPrice: Number.isFinite(e.maxPrice) ? e.maxPrice : null,
      category: e.category ?? null,
    }),
    run: searchProducts,
  },
  ADD_TO_CART: {
    validate: (e) => ({ productRef: e.productRef ?? { this: true }, quantity: Math.min(Math.max(+e.quantity || 1, 1), 10) }),
    run: addToCart,
  },
  REMOVE_FROM_CART: { validate: (e) => ({ productRef: e.productRef }), run: removeFromCart },
  COMPARE: {
    validate: (e) => { if (!Array.isArray(e.productRefs) || e.productRefs.length < 2) throw new Error("need 2"); return e; },
    run: compareProducts,
  },
  CHECKOUT: { validate: () => ({}), run: startCheckout },
  TRACK_ORDER: { validate: () => ({}), run: trackOrder },
  RETURN_ITEM: { validate: (e) => ({ productRef: e.productRef, reason: e.reason ?? "" }), run: initiateReturn },
};

export async function execute(intent, entities, session) {
  const tool = tools[intent];
  if (!tool) return { reply: "Sorry, I didn't catch that. Try: show me running shoes under three thousand.", chip: null };
  try {
    return await tool.run(tool.validate(entities), session);
  } catch (err) {
    return { reply: "I couldn't do that. Could you say it another way?", chip: { type: "error", text: "Not understood" } };
  }
}
```

Each tool returns `{ reply, chip, navigate? }` so the UI shows the action chip, speaks the reply and optionally navigates.

```js
// js/actions/addToCart.js
import { store } from "../store.js";
import { supabase } from "../lib/supabase.js";
import { resolveProduct } from "./resolveProduct.js";

export async function addToCart({ productRef, quantity }, session) {
  const product = resolveProduct(productRef, session);
  if (!product) return { reply: "Which product do you mean? Say a number from 1 to 5.", chip: null };

  const cartId = await ensureCart();
  await supabase.from("cart_items").upsert(
    { cart_id: cartId, product_id: product.id, quantity },
    { onConflict: "cart_id,product_id,variant" }
  );
  await loadCart();
  document.dispatchEvent(new CustomEvent("cart:added", { detail: { product } }));   // triggers 3D drop + green flash
  return { reply: `Added ${product.title} to your cart.`, chip: { type: "success", text: `Added ${product.title}`, undo: () => {} } };
}
```

### 9.4 Resolving "the second one"

```js
// js/actions/resolveProduct.js
export function resolveProduct(ref, session) {
  if (!ref) return null;
  if (ref.index) return session.lastResults[ref.index - 1] ?? null;
  if (ref.id) return session.lastResults.find((p) => p.id === ref.id) ?? null;
  if (ref.this) return session.lastResults.find((p) => p.id === session.focusedProductId) ?? null;
  return null;
}
```
If it returns `null`, the assistant asks: "Which product do you mean? Say a number from 1 to 5."

### 9.5 Rendering: small functions, no framework

```js
// js/ui/productCard.js
export function productCard(p, index) {
  return `
  <article class="product-card" data-id="${p.id}">
    <div class="num">${index}</div>
    <img src="${p.image_url}" alt="${p.title}" loading="lazy" />
    ${p.model_url ? '<span class="badge-3d">3D</span>' : ""}
    <h3>${p.title}</h3>
    <div class="price">₹${Number(p.price).toLocaleString("en-IN")}</div>
    <button class="btn-add" data-add="${p.id}">+ Add</button>
  </article>`;
}
```
Escape any user-provided or database text (`textContent` or an `escapeHtml` helper) before putting it into `innerHTML`. Subscribe renderers to the store: `store.subscribe((s) => renderCart(s.cart))`.

### 9.6 Three.js (vanilla, no wrapper library)

**Product viewer (`THREE_CANVAS_PRODUCT`)**

```js
// js/three/productViewer.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function mountProductViewer(container, modelUrl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.6, 2.4);

  // orange under-glow light (matches the design theme)
  const glow = new THREE.PointLight(0xff6a00, 2.5, 6);
  glow.position.set(0, -0.8, 0.5);
  scene.add(glow, new THREE.AmbientLight(0xffffff, 0.4));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true; controls.autoRotateSpeed = 1.5;
  controls.enablePan = false; controls.minDistance = 1.2; controls.maxDistance = 4;

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  loader.setDRACOLoader(draco);
  loader.load(modelUrl, (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));     // center it
    scene.add(model);
  });

  let raf;
  const tick = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
  tick();

  // cleanup so we don't leak GPU memory when navigating away
  return () => { cancelAnimationFrame(raf); renderer.dispose(); renderer.domElement.remove(); };
}
```

**3D cart (`THREE_CANVAS_CART`)**
- A glass-material tote or cart (`MeshPhysicalMaterial` with `transmission: 1`, `roughness: 0.1`) at the center, with an orange rim light.
- For each cart item, create a small mesh (a box or a plane textured with the product image). Listen for the `cart:added` event, spawn the mesh above the cart, and animate it down with a simple ease (lerp in the `requestAnimationFrame` loop), then give it a gentle sine bob.
- Briefly flash the cart's emissive color to green (`--accent`) on add, then fade back.

```js
// js/three/cart3d.js (core idea)
document.addEventListener("cart:added", async ({ detail }) => {
  const tex = await new THREE.TextureLoader().loadAsync(detail.product.image_url);
  const item = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ map: tex }));
  item.position.set(0, 2, 0);
  scene.add(item);
  drops.push({ mesh: item, targetY: 0.2 + items.length * 0.05, t: 0 });
  items.push(item);
  flashGreen();
});
// inside tick(): for each drop, drop.t += dt; mesh.position.y = lerp(2, targetY, easeOutBounce(drop.t))
```

**Performance**
- Render only while the canvas is visible (`IntersectionObserver`) and stop the loop when navigating away.
- Draco-compress GLBs (`gltf-transform optimize`), lazy-load models, cap pixel ratio at 2.
- Detect low-end devices (`navigator.hardwareConcurrency <= 4`) and default to the "simple view" (static images).
- Always offer a "Switch to simple view" toggle and a text alternative for accessibility.

### 9.7 i18n without a library

```js
// js/i18n.js
let dict = {};
export async function setLang(code) {                 // code: "en-IN" -> file "en"
  const file = code.split("-")[0];
  dict = await fetch(`locales/${file}.json`).then((r) => r.json());
  document.documentElement.lang = file;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
}
export const t = (key, vars = {}) =>
  (dict[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
```
The language choice updates UI strings, `SpeechRecognition.lang`, the TTS voice, and the `reply_language` the LLM is asked to produce. Templated replies (e.g. `"added": "Added {title} to your cart."`) live in the same JSON, so the assistant can answer in Hindi or Kannada without any LLM.

### 9.8 Mapping `design.md` to code

| Design element | Code |
|---|---|
| Black and orange theme, fading background and header | `css/tokens.css`, `css/base.css` (`body::before`), `.app-header` |
| Logo symbol and wordmark | `assets/logo.svg` + `.brand` in `index.html` |
| Voice Orb states | `#voice-orb[data-state]` CSS + `ui/voiceOrb.js` |
| Voice Overlay | `ui/voiceOverlay.js` (CSS transform bottom sheet) |
| Action chips (green for added) | `ui/actionChips.js` reading `store.chips` (auto-dismiss 3s) |
| White "Add to Cart" button | `.btn-add` in `components.css` |
| `THREE_CANVAS_PRODUCT` | `three/productViewer.js` |
| `THREE_CANVAS_CART` | `three/cart3d.js` |
| Stitch HTML export | Use as the starting markup. Split it into `index.html` sections and `components.css`, and replace hard-coded content with the render functions |

---

## 10. Configuration

No build tool means no `.env`. Public values go in `js/config.js`:

```js
// js/config.js  (all of these are PUBLIC by design)
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";          // safe in the browser because RLS protects data
export const RAZORPAY_KEY_ID = "rzp_test_xxxxxxxx";        // key ID only, never the secret
```

Secrets live **only** in Supabase (`supabase secrets set ...`):

```
RAZORPAY_KEY_SECRET=
GROQ_API_KEY=            # or GEMINI_API_KEY / OPENROUTER_API_KEY (optional)
```

Never put `RAZORPAY_KEY_SECRET`, the Supabase **service role** key, or any LLM key in the frontend or the repo.

---

## 11. Build Plan (Phased)

### Phase 0 — Setup (½ day)
- [ ] Folder structure, `index.html`, `tokens.css`, `base.css` with the black and orange background and fading header
- [ ] Local static server (`npx serve`)
- [ ] Supabase project, run `001_init.sql`, seed products, anonymous auth working

### Phase 1 — Text-only shopping loop (1 day)
- [ ] Home, Results, Product Detail, Cart screens styled from the Stitch export
- [ ] `search_products` RPC wired, cart CRUD with RLS
- [ ] Store + render functions

### Phase 2 — Voice MVP (1 day) — **the demo-critical phase**
- [ ] `recognition.js`, `synthesis.js`, voice orb + overlay
- [ ] Rule parser for SEARCH / ADD / REMOVE / SHOW_CART / CHECKOUT
- [ ] Numbered results + "add the second one"
- [ ] Action chips (green on add) + spoken confirmations

### Phase 3 — 3D (1 day)
- [ ] Product viewer with GLB + image fallback
- [ ] 3D cart with drop animation and green flash
- [ ] Simple-view toggle

### Phase 4 — Checkout (1 day)
- [ ] Edge Functions: create order + verify payment
- [ ] Razorpay test checkout, success/failure screens
- [ ] Voice-confirmed checkout flow

### Phase 5 — Orders, Returns, Compare (1 day)
- [ ] `order_events` + Realtime tracking stepper + cron status advance
- [ ] Return flow with spoken reason
- [ ] Comparison screen + verdict

### Phase 6 — Multilingual + LLM fallback (1 day)
- [ ] `locales/*.json` for 5 languages, language switch by voice
- [ ] `llm-proxy` Edge Function + argument validation
- [ ] Number words in Hindi/Kannada

### Phase 7 — Polish and Deploy (½ day)
- [ ] Error/empty states, accessibility pass, reduced motion
- [ ] Deploy the static folder to Netlify / GitHub Pages / Vercel (Supabase is already hosted)
- [ ] Demo script rehearsal (Section 13)

*Stretch:* Whisper-WASM fallback for non-Chrome browsers, `pgvector` recommendations, wishlists, coupon codes by voice, PWA install (manifest + service worker).

---

## 12. Testing

- **Unit (no framework needed):** a small `tests.html` page or Node's built-in `node --test` for `ruleParse` with a table of 100+ utterances (English, Hindi, Kannada), `parseNumberWords`, and the compare-verdict function.
- **Integration:** call `understand()` and `execute()` directly with fake transcripts and assert the store and DB effects.
- **Payment:** Razorpay test cards for success, failure, and a dismissed modal.
- **RLS:** try reading another user's cart/orders with the anon key. It must return nothing.
- **Cross-browser:** Chrome and Edge (full voice), Safari and Firefox (text fallback).
- **Noise test:** run commands with background noise and confirm the "I didn't catch that" path.

---

## 13. Demo Script (3 minutes)

1. Open the app, allow the mic. Say: **"Show me wireless earbuds under two thousand rupees."** → results appear, the assistant summarizes.
2. Say: **"Tell me more about the second one."** → product detail opens with the 3D viewer; rotate it by drag.
3. Say: **"Compare it with the first."** → comparison + spoken verdict.
4. Say: **"Add the second one to my cart."** → item drops into the **3D cart**, the green chip appears.
5. Switch language: **"हिन्दी में बोलो"** → say **"मेरा कार्ट दिखाओ"** (Show my cart).
6. Say: **"Checkout."** → address by voice, confirm, Razorpay test payment opens, pay with the test card.
7. Success screen → say **"Where is my order?"** → tracking stepper animates live via Realtime.
8. Say: **"Return the earbuds, wrong size."** → return confirmation.

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Web Speech API unsupported or inaccurate for accents | Text input always visible; show the transcript for correction; Whisper-WASM fallback |
| LLM free-tier rate limit or downtime | Rules handle most intents; LLM only on low confidence; graceful "UNKNOWN" with suggested prompts |
| Misheard "pay" or destructive commands | Explicit confirmation step for checkout, returns, clear-cart |
| 3D slows low-end phones | Pixel ratio cap, render only when visible, small GLBs, simple-view toggle |
| Price tampering | Server-side totals, signature verification |
| XSS from product text rendered with `innerHTML` | Escape all dynamic text; prefer `textContent` |
| Voice privacy | Clear notice that the browser's speech service processes audio; VibeCart stores no audio |
| Microphone blocked on non-HTTPS | Use `localhost` for dev and HTTPS hosting for production (all free hosts provide it) |
| Real shipping expectation | State clearly in the demo that shipping is simulated |

---

## 15. Free Resources and Links to Bookmark
- Supabase docs: Edge Functions, RLS, Realtime, pg_cron, pgvector
- Razorpay docs: Standard Checkout, Test Mode, Signature Verification
- MDN: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`)
- Three.js docs and examples (GLTFLoader, OrbitControls, MeshPhysicalMaterial)
- Transformers.js (Whisper in the browser)
- Groq, Google AI Studio (Gemini), OpenRouter: free-tier LLM keys
- Poly Pizza, Kenney, Sketchfab (filter: downloadable, CC0/CC-BY) for 3D models
- `gltf-transform` CLI for Draco compression
- DummyJSON for seed product data
- Lucide icons, Google Fonts
