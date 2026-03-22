# Loql full experience redesign — process document

This document defines how we translate the **Stitch** references (`stitch (7)/`) into the live product: **landing** (color + vibe), **mobile `/app`** (pixel-faithful to Stitch), and a **web-only demo module** (laptop users preview the app through a guided story). It is the single source of truth for phases, scope, and acceptance criteria.

---

## 1. Design sources (what we are implementing)

### 1.1 Canonical references in the repo

| Asset | Role |
|--------|------|
| `stitch (7)/stitch/mitti_modern/DESIGN.md` | **Mitti Modern** design system: Urban Bazaar, paper/ink, terracotta/teal/marigold, Work Sans, noise, card motion rules. |
| `stitch (7)/loql_modernism_fusion_prd.html` | **Indian Modernism Fusion** PRD: desktop narrative, key flows (Dwar → Aas-Paas → Katha → Samvaad), Lora + Cabinet Grotesk tokens (note: mobile Stitch uses **Work Sans + Lora** in HTML). |
| `stitch (7)/stitch/*/code.html` | **Per-screen HTML** (Tailwind): exact layout, class names, spacing, and component structure to match for mobile `/app`. |
| `stitch (7)/stitch/*/screen.png` | Visual regression reference for each screen. |

### 1.2 Screen map (Stitch → product meaning)

Stitch folders use Hindi names aligned with flows in the PRD.

| Stitch folder | Working name | User job |
|---------------|----------------|----------|
| `the_dwar_welcome_mobile` | **Dwar** (welcome) | First impression, neighborhood context, primary CTA into the app. |
| `the_dwar_login_mobile` | **Dwar** (login / “Welcome Home”) | Auth entry; alternate layout (split/editorial + form). Use for login/register visual parity. |
| `the_aas_paas_discovery_mobile` | **Aas-Paas** (discovery) | Search, categories, “Loql Hero”, bazaar cards, bottom nav pattern. |
| `the_katha_item_detail_mobile` | **Katha** (item detail) | Polaroid frame, owner “handwritten” note, trust cues, borrow CTA. |
| `the_samvaad_checkout_mobile` | **Samvaad** (request / checkout) | Borrow flow: neighbor context, dates, message, trust footer, success path. |
| `the_samvaad_messages_mobile` | **Samvaad** (messages) | Conversation list / neighborhood chat hub. |
| `the_khata_my_listings_mobile` | **Khata** (my listings) | Lister dashboard: filters, cards, status. |
| `the_pehchan_profile_mobile` | **Pehchan** (profile) | Identity, stats, badges, shared “bazaar” aesthetic. |

### 1.3 Design system alignment (implementation target)

**Colors (canonical for implementation — reconcile PRD vs DESIGN.md)**

- **Paper (background):** `#FDFBF7`
- **Ink (text):** `#2D3142` — never pure black
- **Stone (muted / secondary text):** `#8D99AE`
- **Primary (terracotta / saffron earth):** `#f17350` (Stitch mobile tokens) — align components; if marketing needs the PRD variant `#E27D60`, use it only where it does not break mobile parity (or map both to one CSS variable).
- **Community teal:** `#41B3A3`
- **Marigold / hot accent:** `#F64C72`

**Texture & depth**

- **Mitti noise:** ~3% opacity fractal noise overlay on viewport (Stitch uses inline SVG or image URL).
- **Shadows:** warm, low-contrast — e.g. card `0 4px 12px rgba(45, 49, 66, 0.04)`; primary halo on hover/CTA per DESIGN.md.
- **No-line rule:** prefer tonal surfaces over 1px borders; borders if needed at stone ~10–20% opacity.

**Typography**

- **Mobile `/app` (Stitch HTML):** **Work Sans** (UI/body), **Lora** (serif headlines / handwritten note on Katha). Material Symbols Outlined.
- **Landing / desktop marketing:** PRD suggests **Lora** + **Cabinet Grotesk** — acceptable for **landing only** if we keep `/app` aligned to Stitch (Work Sans + Lora) to avoid mixed systems inside the app shell.

**Motion**

- Bazaar cards: hover/focus `translateY(-8px)` and slight rotate (~1–2deg), warm shadow — per discovery screen CSS.

---

## 2. Product split: landing, mobile app, web-only demo

| Surface | Audience | Goal |
|---------|----------|------|
| **Landing (`/`)** | Everyone | Communicate **color, texture, and emotional tone** of Loql (paper, terracotta, teal, editorial warmth). Conversion to “open app” or “try demo”. |
| **`/app`** | **Mobile browsers** (primary) | **Production web app** — UI must match Stitch references **as closely as practical** (layout, type scale, tokens, components). |
| **Demo / testing module** | **Desktop / laptop only** | Guided **storyline** so non-mobile users *experience* the app (need → open → discover → item → request/book) without implying mobile users should use this instead of `/app`. |

**Hard rule:** On **phone-sized viewports**, users always get the **real** `/app` experience. The **interactive demo** is **not** a substitute for `/app` on mobile.

---

## 3. Phased delivery

### Phase 0 — Audit & traceability (short)

- [ ] Map each Stitch `code.html` to an existing route/screen in `src/components/app/` (e.g. `WelcomeScreen`, `HomeScreen`, `ItemDetailScreen`, …).
- [ ] List gaps (screens in Stitch without a counterpart, or extra app screens not in Stitch).
- [ ] Capture baseline screenshots of current `/app` vs Stitch `screen.png` for key flows.
- [ ] Decide primary breakpoint for “mobile = real app” vs “desktop = demo-first” (e.g. `max-width: 768px` or `md` in Tailwind).

**Exit:** Traceability matrix (Stitch file ↔ React component ↔ route).

---

### Phase 1 — Design tokens & global primitives in code

- [ ] Centralize CSS variables / Tailwind theme: paper, ink, primary, secondary, tertiary, radii (16px default, 24px cards, full pills), shadows, noise utility.
- [ ] Add **global noise layer** and document z-index stacking (Stitch uses `z-[9999]` on noise — normalize to avoid a11y/focus issues).
- [ ] **Icon set:** Material Symbols (Outlined), consistent weights.
- [ ] **App shell chrome:** sticky header, blur, profile chip — match Aas-Paas / Katha patterns.

**Exit:** Tokens used by both landing and `/app`; Storybook or minimal token page optional (only if already in workflow).

---

### Phase 2 — Mobile `/app` — Stitch fidelity pass (highest priority)

Implement screen-by-screen against `code.html` + `screen.png`:

1. **Dwar** — welcome hero split (image + copy), logo, accent rule, CTA.
2. **Aas-Paas** — header, pill search, hero, horizontal category chips, stacked bazaar cards, bottom navigation area / spacing.
3. **Katha** — app bar, polaroid stack, Lora italic quote, metadata, primary CTA (“Borrow with Love” / equivalent).
4. **Samvaad (request)** — full-screen or page layout, neighbor card, date selection, message field, trust strip, loading/success states.
5. **Samvaad (messages)** — list layout, filters/pills, conversation rows.
6. **Khata** — page title, horizontal filter pills, listing cards.
7. **Pehchan** — profile header, rotated avatar, stats, wax-seal / badge styling as in Stitch.
8. **Login (alternate Dwar)** — align `the_dwar_login_mobile` with auth flows.

**Acceptance:** Visual review on a **375×812-style** viewport (and one Android width); interaction states (hover where applicable, focus rings for keyboard).

---

### Phase 3 — Landing page (`/`)

- [ ] Apply **full palette + Mitti noise + editorial layout** from PRD + DESIGN.md (hero, bazaar/stack motifs, teal trust moments, terracotta CTAs).
- [ ] Typography: Lora + Cabinet Grotesk acceptable here if `/app` remains Stitch-true.
- [ ] Clear primary actions: **Open app** (→ `/app` on mobile), **Try the neighborhood demo** (→ demo route on desktop — see Phase 4).
- [ ] Optional: embed a **static** phone mock for decoration — must not block mobile users from a fast path to `/app`.

**Exit:** Landing feels like the same world as Stitch; Lighthouse and content pass for marketing.

---

### Phase 4 — Web-only “Neighborhood demo” (testing module)

**Purpose:** Laptop users cannot hold the phone UI; they get a **linear, skippable story** that mirrors the real app **using the same components/tokens** inside a **phone frame** (or split layout: narrative + device).

**Recommended route:** `/demo` or `/try` (final name TBD) — **only promoted on desktop** from landing; **not** linked as primary on mobile.

**User storyline (script for UX copy & steps)**

1. **Need** — “You need something for the weekend — a tent, a lens, a book — without buying new.”
2. **Open Loql** — User “opens” the app (fade into phone frame).
3. **Aas-Paas** — Search or browse; hero + cards; tap one item.
4. **Katha** — Read the story; see trust (verified neighbor).
5. **Samvaad** — Pick dates, leave a human message.
6. **Handshake** — Success / confirmation; optional CTA: “Use Loql on your phone” → `/app` or store links.

**Implementation notes**

- **Device detection:** `matchMedia('(max-width: …)')` and/or coarse pointer — if mobile, **redirect `/demo` → `/app`** or show a short message: “Open the full app below” with link to `/app`.
- **State:** Step index in URL query (`?step=`) or lightweight state machine for back/next and analytics.
- **Analytics:** Funnel steps `demo_start` → `demo_item_open` → `demo_request_confirm` (names TBD).
- **Reuse:** Prefer composing **the same screen components** as `/app` inside a scaled phone viewport rather than a one-off duplicate design.

**Exit:** Desktop walkthrough completes without horizontal scroll in the frame; mobile users are never trapped in demo instead of `/app`.

---

### Phase 5 — QA, accessibility, performance

- [ ] Focus order and visible focus in modals (Samvaad), forms, and demo.
- [ ] Color contrast for ink on paper and primary buttons.
- [ ] Images: lazy loading, dimensions, alt text from Stitch intent.
- [ ] Performance: noise as lightweight SVG/CSS; avoid huge remote textures without cache policy.

---

## 4. Routing & navigation summary (decision record)

| Route | Mobile | Desktop |
|-------|--------|---------|
| `/` | Marketing; CTA to `/app` | Marketing; primary CTA to **demo** + secondary to `/app` |
| `/app` | **Full Stitch-aligned app** | **Real app** (optional: banner “For the guided tour, try Demo”) — **do not** replace with demo-only |
| `/demo` (or chosen path) | Redirect or minimal “use `/app`” | **Storyline + phone frame** |

*If product prefers a single URL:* `/app` could render **demo wrapper only when `md+` and first visit** — higher risk of confusion; the table above is the recommended clear split.

---

## 5. Open decisions (to resolve in Phase 0)

1. **Terracotta token:** single canonical hex (`#f17350` vs `#E27D60`) for all surfaces.
2. **Desktop `/app`:** bare app vs phone-frame layout vs demo redirect — confirm with product.
3. **Auth:** which Dwar reference is primary post-login (`the_dwar_welcome_mobile` vs `the_dwar_login_mobile`).
4. **Demo route name:** `/demo` vs `/try` vs `/experience`.

---

## 6. File index (Stitch)

- `stitch (7)/stitch/the_dwar_welcome_mobile/code.html`
- `stitch (7)/stitch/the_dwar_login_mobile/code.html`
- `stitch (7)/stitch/the_aas_paas_discovery_mobile/code.html`
- `stitch (7)/stitch/the_katha_item_detail_mobile/code.html`
- `stitch (7)/stitch/the_samvaad_checkout_mobile/code.html`
- `stitch (7)/stitch/the_samvaad_messages_mobile/code.html`
- `stitch (7)/stitch/the_khata_my_listings_mobile/code.html`
- `stitch (7)/stitch/the_pehchan_profile_mobile/code.html`

Supporting: `stitch (7)/stitch/mitti_modern/DESIGN.md`, `stitch (7)/loql_modernism_fusion_prd.html`.

---

*Document version: 1.0 — aligns Stitch mobile HTML, Mitti PRD, and codebase routes under `src/app/app/`.*
