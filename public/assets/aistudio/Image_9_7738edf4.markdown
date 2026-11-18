---
name: VibeCart Audio Surface
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb694'
  primary: '#ffb694'
  on-primary: '#571f00'
  primary-container: '#ff6a00'
  on-primary-container: '#571f00'
  inverse-primary: '#a14000'
  secondary: '#ffb877'
  on-secondary: '#4c2700'
  secondary-container: '#d27c1b'
  on-secondary-container: '#422200'
  tertiary: '#26e19a'
  on-tertiary: '#003823'
  tertiary-container: '#00ae74'
  on-tertiary-container: '#003923'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb694'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7b2f00'
  secondary-fixed: '#ffdcc1'
  secondary-fixed-dim: '#ffb877'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6c3a00'
  tertiary-fixed: '#53feb4'
  tertiary-fixed-dim: '#26e19a'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005234'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Sora
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  voice-transcript:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a nocturnal, voice-driven commerce experience that bridges tactile consumer electronics and atmospheric digital spaces. The aesthetic synthesizes **Dark-Mode Glassmorphism** with **Atmospheric Radial Illumination**, creating the impression of warm sunset light refracting through frosted acoustic glass.

The brand targets modern, multimodal shoppers seeking frictionless voice discovery. Interactions feel intimate, responsive, and cinematic rather than transactional. Key visual cues rely on concentrated photonic blooms, subtle translucency, and crisp high-contrast controls that direct user focus during fast audio-driven navigation.

## Colors

The palette is engineered specifically for deep-contrast low-light environments, pairing an ultra-deep obsidian base with sunset chromatic energy:

- **Base Background (`#050505`)**: The core canvas foundation absorbing light.
- **Surface Elevation (`#111111`)**: Deep opaque structure beneath floating layers.
- **Glass Tint (`rgba(255, 255, 255, 0.06)`)**: The ambient translucent plane, paired with `rgba(255, 255, 255, 0.10)` hair-line structural borders.
- **Primary Energy Stack**:
  - `Primary Accent (#FF6A00)`: Primary audio waveforms, dynamic voice orb pulsing, and energetic highlights.
  - `Primary Glow (#FFA040)`: Diffused atmospheric flares and focus rings.
  - `Primary Deep (#E34A00)`: Active states, pressed states, and base shadow tints.
- **Semantic Accents**:
  - `Success Confirm (#2EE59D)`: Audio cart commitment, item additions, voice verification.
  - `Info Tracking (#4DA3FF)`: Order timeline progress, live updates.
  - `Deals & Ratings (#FFC83D)`: Star indicators, flash savings, trending items.
  - `Danger & Terminate (#FF4D5E)`: Audio session cancel, cart item removal.
- **Typography Tone**:
  - `Text Primary (#F5F5F5)`: Display headings, vital pricing, primary values.
  - `Text Secondary (#9A9A9A)`: Audio transcriptions, metadata, secondary specifications.
  - `High-Contrast Pure White (#FFFFFF)`: Key commit actions ("Add to Cart", checkout completion).

## Typography

The typographic hierarchy relies on a pairing between **Sora** and **Inter**:

- **Sora** governs all Display, Heading, and Voice Transcription levels. Its wide, geometric posture balances precision with futuristic character, allowing streaming audio phrases and primary product names to command clear attention.
- **Inter** provides neutral structure for all conversational metadata, pricing figures, system feedback, and form components, guaranteeing high legibility across dense product grids and rapid transaction summaries.
- Keep tabular numbers (`tnum`) enabled on all price displays, quantity counters, and delivery ETA countdowns.

## Layout & Spacing

The interface employs a responsive fluid grid optimized around persistent audio accessibility:

- **Breakpoints & Layouts**:
  - **Mobile (< 768px)**: 4-column layout with `1rem` margins and `1rem` gutters. The bottom 96px is reserved for the floating audio orb and live transcript docked surface.
  - **Tablet (768px - 1024px)**: 8-column layout with `2rem` margins and `1.5rem` gutters. Product cards adopt a dual-column display.
  - **Desktop (> 1024px)**: 12-column layout with max-width `1280px`, `3rem` margins, and `2rem` gutters. Dedicated voice activity channel docks cleanly alongside the central discovery stream.
- **Spacing Cadence**: All spatial offsets leverage an 8pt base grid with a 4pt micro-step (`space-xs: 4px`, `space-sm: 8px`, `space-md: 16px`, `space-lg: 24px`, `space-xl: 40px`).

## Elevation & Depth

Visual hierarchy uses frosted volumetric layers back-lit by warm photon bleeds rather than cold drop shadows:

- **Atmospheric Underglow**: Fixed canvas corners feature diffuse radial gradients spreading `#FF6A00` and `#FFA040` at 12–18% opacity, simulating evening light passing behind smoked glass.
- **Glass Composite Layer**:
  - Base: `rgba(255, 255, 255, 0.06)`.
  - Filter: `backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`.
  - Border: 1px solid `rgba(255, 255, 255, 0.10)`.
  - Top Sheen: An inset highlight `inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)` paired with a soft upper ambient glow `0 -4px 16px -2px rgba(255, 106, 0, 0.15)`.
- **Active Radiant Glow**: Critical interactive components (e.g., listening state of the voice orb, primary transaction triggers) cast an intense chromatic projection: `box-shadow: 0 8px 40px rgba(255, 106, 0, 0.30), 0 0 12px rgba(255, 160, 64, 0.20)`.
- **Modals & Overlays**: Grounded on `#111111` backing panels with a `32px` blur glass frontplate, floating above an `85%` darkened canvas veil.

## Shapes

The design uses a hierarchy of three distinct radius scales:

- **Product & Structural Cards**: Fixed `20px` radius, softening large content areas while maintaining grid structure.
- **Interactive Controls & Input Fields**: Fixed `14px` radius for touch targets, primary buttons, and speech status containers.
- **Chips, Badges, & Voice Pill Triggers**: Fully rounded `9999px` capsule silhouettes, visually distinguishing interactive filters and listening indicators from content cards.

## Components

### Buttons
- **High-Contrast Primary (Add to Cart / Commit)**: `#FFFFFF` fill with `#050505` text (Inter SemiBold). Height: 48px, radius: 14px. Hover produces a subtle `#FFA040` ambient halo; active press scales to `0.98`.
- **Voice Action Button**: Dedicated circular or pill button with `#FF6A00` gradient to `#E34A00`, bearing the radiant glow (`0 8px 40px rgba(255, 106, 0, 0.30)`). Includes dynamic SVG soundwave rings.
- **Secondary / Ghost**: Glass fill (`rgba(255, 255, 255, 0.06)`), 1px border (`rgba(255, 255, 255, 0.10)`), `#F5F5F5` text. Hover shifts background to `rgba(255, 255, 255, 0.12)`.

### Chips & Filters
- **Standard Filter**: `9999px` capsule. Height: 32px. Glass surface with `rgba(255, 255, 255, 0.08)` border. Text: `#9A9A9A`.
- **Active / Spoken Filter**: Inset orange highlight, border color `#FF6A00`, text `#F5F5F5`, subtle `0 0 12px rgba(255, 106, 0, 0.25)` outer bloom.

### Product Cards
- **Structure**: 20px radius, glass surface (`backdrop-filter: blur(16px)`), 1px border `rgba(255, 255, 255, 0.10)`, padding: `1.5rem`.
- **Visuals**: Dark inset product canvas (`#0B0B0B`), with deal badges positioned at the top left using the gold token (`#FFC83D`).
- **Interactive State**: Subdued orange top border sheen (`rgba(255, 106, 0, 0.40)`) illuminates on hover or voice selection.

### Input Fields & Voice Transcripts
- **Voice Bar / Search Input**: Height: 56px, radius: 14px. Background `#111111` layered over translucent glass. Displays live speech transcription in `Sora 16px/Medium` text (`#F5F5F5`), with pending words highlighted in `#FFA040`.
- **Microphone Status Trigger**: Right-aligned inside input; animates smoothly between resting gray and glowing orange state during capture.

### Selection Controls (Checkboxes & Radios)
- **Checkboxes**: 20px square with 6px border-radius. Border: 1.5px solid `rgba(255, 255, 255, 0.20)`. Checked: `#2EE59D` fill with `#050505` checkmark.
- **Radio Buttons**: 20px circle. Unselected: 1.5px border `rgba(255, 255, 255, 0.20)`. Selected: `#FF6A00` outer border with a centered `#FFA040` solid dot.

### Specialized Voice Indicator Orb
- Central floating element with base size 64px x 64px. Multi-layered radial gradient (`#FFA040` to `#FF6A00` to `#E34A00`). Uses continuous CSS keyframe breathing animations scaling from `1.0` to `1.08` with real-time audio input level visualization.