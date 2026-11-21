<div align="center">

<!-- Animated 3D Isometric Hero Banner (Color-Matched: #050505 Obsidian + #FF6A00 Sunset Copper) -->
<a href="https://buildathon-y5uv.vercel.app/">
  <img src="./docs/vibecart-hero-3d.svg" alt="VoicoCart 3D Voice-First Spatial Commerce Banner" width="100%" />
</a>

<br /><br />

<!-- Dynamic Typing Sub-headline -->
<a href="https://buildathon-y5uv.vercel.app/">
  <img src="https://readme-typing-svg.demolab.com?font=Sora&weight=700&size=22&duration=3000&pause=1000&color=FF6A00&center=true&vCenter=true&multiline=false&width=780&height=42&lines=Voice-First+3D+E-Commerce+Engineered+for+India+%F0%9F%8E%99%EF%B8%8F;Agora+Conversational+AI+%2B+Murf+Falcon+2+%2B+Gemini+3.1;Interactive+Three.js+3D+%2B+Installable+Mobile+PWA+%F0%9F%93%B1" alt="Dynamic Typing Headline" />
</a>

<br />

<!-- Dynamic Color-Matched Badges (#050505 + #FF6A00 / #FFA040 / #2EE59D) -->
<p>
  <a href="https://buildathon-y5uv.vercel.app/">
    <img src="https://img.shields.io/badge/LIVE_DEMO-buildathon--y5uv.vercel.app-FF6A00?style=for-the-badge&logo=vercel&logoColor=white&labelColor=050505" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/React_19-TypeScript-FFA040?style=for-the-badge&logo=react&logoColor=FF6A00&labelColor=050505" alt="React 19" />
  <img src="https://img.shields.io/badge/Three.js-3D_%2B_2D_View-FF6A00?style=for-the-badge&logo=threedotjs&logoColor=white&labelColor=050505" alt="Three.js 3D" />
  <img src="https://img.shields.io/badge/Gemini_3.1-Flash_Lite_NLU-4DA3FF?style=for-the-badge&logo=googlegemini&logoColor=4DA3FF&labelColor=050505" alt="Gemini NLU" />
  <img src="https://img.shields.io/badge/Agora_%2B_Murf-Falcon_2_Voice-2EE59D?style=for-the-badge&logo=webrtc&logoColor=2EE59D&labelColor=050505" alt="Agora & Murf" />
  <img src="https://img.shields.io/badge/Supabase-Postgres_%2B_RLS-2EE59D?style=for-the-badge&logo=supabase&logoColor=2EE59D&labelColor=050505" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-Mobile_Installable-FFA040?style=for-the-badge&logo=pwa&logoColor=FFA040&labelColor=050505" alt="PWA" />
</p>

<!-- Quick Section Navigation -->
<p>
  <a href="#-architecture-overview">Architecture</a> •
  <a href="#-how-the-ai-thinks-3-layer-brain">AI Brain (LLM + Rules)</a> •
  <a href="#-murf-ai--agora-live-voice-pipeline">Murf &amp; Agora Voice</a> •
  <a href="#-catalog-separation--smart-search">Catalog Separation</a> •
  <a href="#%EF%B8%8F-exception--out-of-scope-handling">Exception Handling</a> •
  <a href="#-database--security-supabase">Supabase DB</a> •
  <a href="#-deployment--setup">Setup</a> •
  <a href="#-author--connect">Author</a>
</p>

</div>

---

## ✨ What Is VoicoCart?

**VoicoCart — Shop by Talking** is a production-grade, **voice-driven dark-mode commerce platform** built with an obsidian (`#050505`) and Sunset Copper (`#FF6A00`) spatial design language. Unlike standard chatbots that only reply with text, **VoicoCart turns natural speech into real UI & database actions**:

- 🎙️ **Hands-Free End-to-End Shopping**: Search products by budget/occasion, compare items side-by-side, add variants to cart, **fill & permanently save delivery addresses**, update profile info, switch 3D/2D modes, launch Razorpay checkout, and track or return orders — all by voice or text.
- 🧊 **Interactive Three.js 3D + Instant 2D Simple View**: Rotate 3D product models in real time with dynamic colorway lighting (`Obsidian Copper`, `Sunset Amber`, `Titanium Slate`), or toggle **Simple View (2D Studio Photos)** for instant lightweight browsing.
- 🗣️ **Real-Time Multilingual Voice (5 Indian Languages)**: Powered by **Agora Conversational AI** and **Murf AI Falcon 2** Indian voices across **English (IN), Hindi/Hinglish, Kannada, Tamil, and Telugu**.
- 📱 **Native-Like Mobile App & Installable PWA**: Sticky mobile header & bottom tab navigation, swipeable filter rails, offline status detection, Service Worker caching, and one-tap home-screen installation on Android & iOS.
- 🔐 **Enterprise-Ready Cloud Sync & Payments**: **Supabase PostgreSQL** with Row Level Security (RLS), Google OAuth & Magic Link sign-in, Realtime order tracking, and server-verified **Razorpay HMAC-SHA256** checkout.

---

## 🏗️ Architecture Overview

> End-to-end data flow connecting the React/Three.js client, Hybrid AI Engine, Express/Vercel Serverless Backend, Murf/Agora Voice Stack, and Supabase PostgreSQL.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#050505', 'primaryColor': '#181717', 'primaryBorderColor': '#FF6A00', 'primaryTextColor': '#F5F5F5', 'lineColor': '#FFA040', 'secondaryColor': '#111111', 'tertiaryColor': '#0B0908', 'edgeLabelBackground': '#111111' }}}%%
flowchart TB
    User["👤 Shopper (Mobile PWA / Desktop Web)"]

    subgraph Frontend["🎨 Frontend Layer (React 19 + Vite 8 + Tailwind v4)"]
        Router["Hash SPA Router + Global Store (src/state/store.tsx)"]
        Viewer3D["🧊 Three.js 3D Viewport / 2D Studio Simple View"]
        PWA["📱 Service Worker + Offline Cache + Install Hook"]
    end

    subgraph AI_Layer["🧠 Hybrid AI & Voice Intelligence"]
        RuleL1["⚡ L1: 0ms Deterministic Rule Engine (ruleParser.ts)"]
        GeminiL2["🤖 L2: Google Gemini 3.1 Flash Lite (/api/nlu & llm-proxy)"]
        GuardL3["🛡️ L3: Intent Sanitizer & Guard (intentValidator.ts)"]
        AgoraAI["📡 Agora RTC + Conversational AI Agent"]
        MurfTTS["🔊 Murf AI Falcon 2 (24kHz Indian MP3 / WebSocket TTS)"]
    end

    subgraph Backend["⚙️ Serverless & Node Backend (server/handlers.ts)"]
        ExpressDev["Express Middleware Server (server.ts)"]
        VercelProd["Vercel Serverless Functions (/api/*)"]
        RzpAPI["💳 Razorpay Order & HMAC-SHA256 Verification"]
    end

    subgraph Database["🗄️ Supabase Cloud Platform"]
        Auth["🔑 Google OAuth + Magic Link Auth"]
        Postgres["🐘 11 Postgres Tables + pg_trgm Search + RLS"]
        Realtime["⚡ Supabase Realtime (order_events)"]
    end

    User <--> Router
    Router --> Viewer3D
    Router --> PWA
    Router --> RuleL1
    RuleL1 -- "High Confidence (>= 0.75)" --> GuardL3
    RuleL1 -- "Complex / Hinglish / Ambiguous" --> GeminiL2
    GeminiL2 --> GuardL3
    GuardL3 -- "Execute Real UI/DB Action" --> Router

    User <-- "Live Voice Call" --> AgoraAI
    AgoraAI <--> GeminiL2
    AgoraAI --> MurfTTS
    Router -- "Speak Reply" --> VercelProd
    VercelProd --> MurfTTS
    Router <--> VercelProd
    ExpressDev -. "Shared Handler Logic" .-> VercelProd
    VercelProd <--> RzpAPI

    Router <--> Auth
    Router <--> Postgres
    Realtime --> Router
```

---

## 🛠️ Complete Tech Stack

| Layer | Technologies Used | Purpose in VoicoCart |
| :--- | :--- | :--- |
| **Frontend UI** | `React 19`, `TypeScript`, `Vite 8`, `Tailwind CSS v4`, `Lucide Icons`, `Motion` | Dark matte obsidian UI (`#050505`), glassmorphic surfaces, mobile app bottom navigation |
| **3D & Media** | `Three.js`, `@types/three`, Custom 2D Studio Photography | Interactive 3D product previews with colorway switching + 2D Simple View fallback |
| **PWA & Offline** | `vite-plugin-pwa`, Workbox Service Worker, Custom SVG/PNG Manifest Icons | Installable Android/iOS home-screen app, asset caching, offline banner & fallback |
| **AI & NLU** | `@google/genai` (`gemini-3.1-flash-lite`), Custom Regex/Synonym Rule Engine | Hybrid 0ms local rules + strict JSON Schema LLM intent extraction |
| **Voice AI** | `agora-rtc-sdk-ng`, `agora-token`, **Agora Conversational AI**, **Murf AI Falcon 2**, Web Speech API | Real-time voice call agent, multi-language Indian neural TTS + browser speech fallback |
| **Backend** | `Node.js`, `Express 4`, **Vercel Serverless Functions** (`/api/*`), **Supabase Edge Functions** | Protects secret keys, signs Agora tokens, calls Gemini & Murf, verifies Razorpay orders |
| **Database & Auth** | **Supabase PostgreSQL**, `pg_trgm`, **Row Level Security (RLS)**, **Supabase Realtime** | User accounts, Google/Email Auth, fuzzy product search, saved addresses, live order tracking |
| **Payments** | **Razorpay Checkout JS SDK** + Server `HMAC-SHA256` Verification | Server-computed INR order totals + cryptographic payment signature validation |
| **Testing** | `node:test`, `node:assert/strict`, `tsx`, Playwright CLI | 13 deterministic NLU/catalog/security unit tests + live desktop & mobile UI checks |

---

## 🧠 How the AI Thinks (3-Layer Brain)

> Instead of letting an LLM hallucinate text replies that do nothing on screen, **VoicoCart** runs every command through a **3-Layer Hybrid Decision Pipeline**:

<div align="center">
  <img src="./docs/vibecart-pipeline-3d.svg" alt="VoicoCart 3D Hybrid AI & Voice Pipeline" width="100%" />
</div>

### Step-by-Step Execution Flow:
1. **Layer 1 — Zero-Latency Local Rule Engine (`src/nlu/ruleParser.ts`)**:
   - Evaluates crisp shopping commands locally in **0ms** (works even completely offline): e.g., *"Add the second one"*, *"Compare 1 and 2"*, *"Save my delivery address: name Priya Nair, phone 9876543211, address 18 Indiranagar 100ft Rd, city Bengaluru, state Karnataka, pincode 560038"*, *"Turn on simple view"*, or *"Hindi mein bolo"*.
   - Also parses **compound chained commands** like *"Add PulseBuds Air ANC and redirect to checkout"* -> `[ADD_TO_CART, CHECKOUT]`.
2. **Layer 2 — Google Gemini LLM (`gemini-3.1-flash-lite`)**:
   - When a query is natural, Hinglish, regional, or ambiguous (e.g., *"Mom ke liye 3000 ke andar kuch acha gift dikhao"* or *"Running gear for morning jog"*), it invokes `supabase/functions/llm-proxy` or `/api/nlu`.
   - Uses `ThinkingLevel.MINIMAL` for ultra-low latency and enforces a **strict `responseSchema` (Structured JSON)** so Gemini can **only** emit validated intents & entities — it cannot invent fake products or tamper with prices.
3. **Layer 3 — Intent Sanitizer & Action Executor (`src/nlu/intentValidator.ts` & `store.tsx`)**:
   - Clamps quantities (`1–10`), validates category slugs, cleans Indian mobile numbers (`+91` -> 10 digits) and PIN codes, and dispatches live state + Supabase database updates.

<details>
<summary><b>📋 Click to View All 23 AI-Controlled Intents & Real Actions</b></summary>

| Category | Supported Intents | What the App Actually Does |
| :--- | :--- | :--- |
| **Discovery & Q&A** | `SEARCH_PRODUCTS`, `RECOMMEND`, `ASK_PRODUCT`, `COMPARE` | Filters 22 products, reads specs aloud, opens side-by-side comparison table |
| **Cart Control** | `ADD_TO_CART`, `REMOVE_FROM_CART`, `UPDATE_QUANTITY`, `CLEAR_CART`, `SHOW_CART` | Adds exact color/quantity, adjusts cart, updates badge & Supabase cart |
| **Profile & Address AI** | `SAVE_ADDRESS`, `UPDATE_PROFILE`, `FILL_CHECKOUT` | Extracts name, phone, street, city, state, pincode; saves permanently to Profile & Supabase `addresses` |
| **Checkout & Orders** | `CHECKOUT`, `CONFIRM`, `DENY`, `TRACK_ORDER`, `RETURN_ITEM` | Launches Razorpay payment flow, opens live order tracker, creates return ticket |
| **App & View UI** | `TOGGLE_SIMPLE_VIEW`, `NAVIGATE`, `SIGN_IN_GOOGLE`, `CHANGE_LANGUAGE`, `HELP`, `UNKNOWN` | Switches 2D/3D view, navigates screens, triggers Google OAuth, switches app language |

</details>

---

## 🎙️ Murf AI & Agora Live Voice Pipeline

VoicoCart supports **two synchronized voice architectures** (`src/voice/`):

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#050505', 'primaryColor': '#181717', 'primaryBorderColor': '#FF6A00', 'primaryTextColor': '#F5F5F5', 'lineColor': '#FFA040', 'edgeLabelBackground': '#111111' }}}%%
sequenceDiagram
    autonumber
    participant U as 👤 Shopper
    participant App as 📱 VoicoCart UI
    participant API as ⚙️ Backend (/api/*)
    participant Ag as 📡 Agora AI Engine
    participant Murf as 🔊 Murf Falcon 2

    Note over U,Murf: Mode A — Text / Browser Mic Command
    U->>App: Speaks or types shopping command
    App->>App: L1 Rules -> L2 Gemini -> Execute UI Action
    App->>API: POST /api/tts/murf (text, lang, gender)
    API->>Murf: POST speech/stream (model: FALCON, 24kHz MP3)
    Murf-->>App: Streams natural Indian voice audio (fallback: Web Speech API)

    Note over U,Murf: Mode B — Live Agora Voice Call (Tap Glowing Orb)
    U->>App: Taps Voice Orb Mic
    App->>API: POST /api/agora/token & /api/agora/start
    API->>Ag: Joins Agora Conversational Agent (Ares ASR + Gemini 3.1 + Murf WS)
    U<<->>Ag: Full-duplex real-time voice conversation
    Ag-->>App: Streams live transcripts -> Auto-updates Cart / Profile / Checkout!
```

### Supported Murf Falcon 2 Indian Voices (`src/voice/murfVoices.ts`)

| Language | Locale | Female Voice | Male Voice | Live ASR Language |
| :--- | :--- | :--- | :--- | :--- |
| **English (India)** | `en-IN` | **Anisha** | **Abhinav** | `en-IN` |
| **हिन्दी (Hindi & Hinglish)** | `hi-IN` | **Pooja** | **Prathamesh** | `hi-IN` |
| **ಕನ್ನಡ (Kannada)** | `kn-IN` | **Pooja** | **Harman** | `kn-IN` |
| **தமிழ் (Tamil)** | `ta-IN` | **Pooja** | **Karthikeyan** | `ta-IN` |
| **తెలుగు (Telugu)** | `te-IN` | **Pooja** | **Samar** | `te-IN` |

---

## 📦 Catalog Separation & Smart Search

VoicoCart maintains **22 distinct electronics, wearables & lifestyle products** neatly separated across **8 categories** (`src/data/catalog.ts` & Supabase `categories` + `products`):

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#050505', 'primaryColor': '#181717', 'primaryTextColor': '#F5F5F5', 'pie1': '#FF6A00', 'pie2': '#FFA040', 'pie3': '#2EE59D', 'pie4': '#4DA3FF', 'pie5': '#FFC83D', 'pie6': '#E34A00', 'pie7': '#FF4D5E', 'pie8': '#9A9A9A', 'pieStrokeColor': '#050505', 'pieSectionTextColor': '#050505', 'pieLegendTextColor': '#F5F5F5', 'pieTitleTextColor': '#F5F5F5' }}}%%
pie showData
    title VoicoCart Store Catalog — 22 Products Across 8 Categories
    "Audio (Earbuds & Studio Headphones)" : 4
    "Wearables (AMOLED Watch & Fitness Band)" : 3
    "Footwear (Carbon Running & Trail Shoes)" : 3
    "Smart Home (Speakers & Desk Light Bars)" : 3
    "Peripherals (Mechanical Keyboards & Mice)" : 3
    "Accessories (MagSafe Power & Tech Slings)" : 2
    "Cameras (4K Pocket Action & Vlog Cams)" : 2
    "Eyewear (Open-Ear AI Smart Glasses)" : 2
```

### How Smart Catalog Filtering & Ranking Works:
1. **Multilingual Synonym Expansion**: Queries like *"morning jog"*, *"tws"*, *"magsafe"*, or Hindi/Kannada product words expand via `SYNONYMS` (e.g. `jog -> shoes/footwear`, `pods -> earbuds`).
2. **Hard Attribute Filters**: Filters strictly by `category`, `minPrice`, `maxPrice`, and colorway `variant`.
3. **Weighted Relevance Ranking**: Matches in **Product Title (`+4`)**, **Tags (`+3`)**, and **Description/Brand (`+1`)**, tie-broken by customer rating.
4. **PostgreSQL Fuzzy Search (`search_products` RPC)**: In Supabase, searches leverage a GIN `tsvector` index plus `pg_trgm` trigram similarity so even minor typos still find the exact product.

---

## 🛡️ Exception & Out-of-Scope Handling

What happens if someone asks the voice assistant an unrelated or out-of-limit question like ***"Where is India?"*** or ***"What is 2 + 2?"***

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#050505', 'primaryColor': '#181717', 'primaryBorderColor': '#FF6A00', 'primaryTextColor': '#F5F5F5', 'lineColor': '#FFA040', 'edgeLabelBackground': '#111111' }}}%%
flowchart TD
    Query["❓ Out-of-Scope Input: 'Where is India?'"] --> Mode{"Active Voice Mode"}

    Mode -- "Text / Browser Mic Command" --> RuleCheck["L1 Rule Engine: No shopping match (confidence = 0)"]
    RuleCheck --> GeminiCheck["L2 Gemini NLU: Strictly locked to shopping schema"]
    GeminiCheck --> Unknown["Maps safely to intent: UNKNOWN"]
    Unknown --> SafeUI["✅ Safe Handling (Zero Crash / Zero Bad Navigation):\n• Displays red hint chip: Try 'Add PulseBuds Air ANC and checkout'\n• Murf AI speaks localized fallback in user's language"]

    Mode -- "Live Agora Conversational Call" --> AgoraLLM["Agora Agent (Gemini Chat + Strict Store Prompt)"]
    AgoraLLM --> GuardReply["✅ Replies concisely (< 24 words) & guides shopper back to VoicoCart\n• On unclear audio: 'Sorry, I missed that. Could you repeat your shopping request?'"]
```

### Built-In Resilience Matrix

| Edge Case / Failure Scenario | Graceful Recovery Mechanism |
| :--- | :--- |
| **Out-of-Scope Query (*"Where is India?"*)** | Routed to `UNKNOWN`; keeps screen stable, shows helpful hint chip, speaks localized prompt |
| **Internet Disconnected (Offline)** | PWA `OfflineIndicator` alerts user; cached assets load; `L1 Rule Engine` works offline |
| **Gemini API Unavailable / No Key** | `nluRouter.ts` silently falls back to deterministic `ruleParser.ts` without breaking UI |
| **Murf TTS Error / Offline** | `speech.ts` seamlessly switches to browser `window.speechSynthesis` |
| **Invalid Quantities / Prompt Injection** | `intentValidator.ts` clamps quantities (`1–10`) and strips unapproved categories/intents |
| **Tampered Client Price at Checkout** | Backend recalculates INR totals from server `CATALOG` & verifies Razorpay `HMAC-SHA256` signature |
| **Low-End Mobile / Slow WebGL** | One-tap (or voice-triggered) **Simple View** swaps Three.js canvases for crisp 2D studio photos |

---

## 🗄️ Database & Security (Supabase)

<details>
<summary><b>🔍 Click to Expand Full Supabase PostgreSQL Schema (11 Tables + RLS + Realtime)</b></summary>

1. **`categories`** & **`products`** — Storefront catalog with `tsvector` + `pg_trgm` GIN indexes (`public read`).
2. **`profiles`** — User identity (`full_name`, `phone`, `email`, `avatar_url`, `preferred_lang`) auto-populated on Google/Email sign-in via `handle_new_user()` trigger.
3. **`addresses`** — Multi-address delivery book with `is_default` flag and instant Checkout prefill.
4. **`carts`** & **`cart_items`** — Persistent active cart synchronized across devices.
5. **`orders`**, **`order_items`**, & **`order_events`** — Complete order history + live status progression streamed via **Supabase Realtime**.
6. **`returns`** — One-click or voice-triggered return/refund tracking.
7. **`user_activity_logs`** — Audit trail logging `user_created`, `profile_updated`, and `address_saved`.

> Every user table enforces **Row Level Security (`auth.uid() = user_id`)** so users can strictly access only their own data. Guest users automatically persist data in `localStorage` and sync once signed in.

</details>

---

## 🚀 Deployment & Setup

<details>
<summary><b>⚙️ Click to View Local Setup, Environment Variables & Production Deployment Guide</b></summary>

### 1. Run Locally
```bash
git clone https://github.com/PIYUSH-JOSHI1/<your-repo-name>.git
cd <your-repo-name>
npm install
npm run dev
```

### 2. Run Automated Tests & Checks
```bash
npx --yes tsx --test src/nlu/nlu.test.ts   # 13 NLU, Compare, Voice & Address unit tests
npm run lint                                # TypeScript strict check
npm run build                               # Production Vite + PWA bundle
```

### 3. Environment Variables (`.env.example`)
| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Public | Supabase Auth, Postgres DB & Realtime |
| `GEMINI_API_KEY` | Server Only | Gemini `gemini-3.1-flash-lite` NLU & Agora Agent LLM |
| `AGORA_APP_ID` / `VITE_AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` | Client + Server | Live Agora RTC & Conversational AI Agent |
| `MURF_API_KEY` | Server Only | Murf AI Falcon 2 Indian TTS streaming |
| `RAZORPAY_KEY_ID` / `VITE_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Client + Server | Razorpay order creation & HMAC signature verification |

### 4. Supabase Database Setup
Run `supabase/migrations/001_init.sql` followed by `supabase/migrations/002_profile_logs_and_new_products.sql` in the **Supabase SQL Editor**, enable Google OAuth & Redirect URLs, and deploy to **Vercel**.

</details>

---

## 👨‍💻 Author & Connect

<div align="center">

<table width="100%">
  <tr>
    <td align="center" width="100%" bgcolor="#0B0908">
      <br />
      <img src="https://img.shields.io/badge/CRAFTED_BY-PIYUSH_JOSHI-FF6A00?style=for-the-badge&labelColor=050505" alt="Piyush Joshi" />
      <h3>Piyush Joshi — Full-Stack & AI Engineer</h3>
      <p><i>Building voice-first spatial commerce, real-time AI interfaces & production web experiences.</i></p>
      <p>
        <a href="mailto:piyushaundhekar@gmail.com">
          <img src="https://img.shields.io/badge/Email-piyushaundhekar%40gmail.com-FF6A00?style=for-the-badge&logo=gmail&logoColor=white&labelColor=111111" alt="Email Piyush Joshi" />
        </a>
        <a href="https://www.linkedin.com/in/piyush-joshi-81403925a/" target="_blank">
          <img src="https://img.shields.io/badge/LinkedIn-Piyush_Joshi-4DA3FF?style=for-the-badge&logo=linkedin&logoColor=white&labelColor=111111" alt="LinkedIn" />
        </a>
        <a href="https://github.com/PIYUSH-JOSHI1" target="_blank">
          <img src="https://img.shields.io/badge/GitHub-PIYUSH--JOSHI1-FFA040?style=for-the-badge&logo=github&logoColor=FFA040&labelColor=111111" alt="GitHub" />
        </a>
        <a href="https://piyush-joshi.netlify.app/" target="_blank">
          <img src="https://img.shields.io/badge/Portfolio-piyush--joshi.netlify.app-2EE59D?style=for-the-badge&logo=netlify&logoColor=2EE59D&labelColor=111111" alt="Portfolio" />
        </a>
      </p>
      <br />
    </td>
  </tr>
</table>

<br />

<!-- Dynamic GitHub Activity Card (Color-Matched to Obsidian #050505 + Sunset Copper #FF6A00) -->
<a href="https://github.com/PIYUSH-JOSHI1">
  <img src="https://github-readme-stats.vercel.app/api?username=PIYUSH-JOSHI1&show_icons=true&title_color=FF6A00&icon_color=FFA040&text_color=F5F5F5&bg_color=050505&border_color=2A1A10&border_radius=14" alt="Piyush Joshi GitHub Stats" height="165" />
</a>
<a href="https://github.com/PIYUSH-JOSHI1">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=PIYUSH-JOSHI1&background=050505&border=2A1A10&stroke=2A1A10&ring=FF6A00&fire=FFA040&currStreakLabel=FF6A00&sideLabels=F5F5F5&dates=9A9A9A&currStreakNum=F5F5F5&sideNums=2EE59D&border_radius=14" alt="Piyush Joshi GitHub Streak" height="165" />
</a>

<br /><br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:E34A00,50:FF6A00,100:FFA040&height=110&section=footer&text=VoicoCart%20%C2%B7%20Shop%20by%20Talking&fontColor=050505&fontSize=20&fontAlignY=72" alt="VoicoCart Footer Wave" width="100%" />

</div>
