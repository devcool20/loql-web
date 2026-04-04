# Mitti Modern: Design System Document

### 1. Overview & Creative North Star
**Creative North Star: The Urban Bazaar**
Mitti Modern is a high-end editorial design system that bridges the gap between digital precision and organic, community-driven warmth. Inspired by the concept of "Aas-Paas" (Neighborhood), it rejects the rigid, clinical grids of standard SaaS applications in favor of a "Waterfall" layout—dynamic, asymmetrical, and deeply tactile. 

The system utilizes a "Paper and Ink" philosophy, where the background acts as a physical substrate (Paper) and typography provides the character (Ink). Intentional tilts, masonry grids, and subtle grain textures ("Mitti-Noise") break the "template" look, creating a curated, editorial experience that feels human-centric.

### 2. Colors
The palette is rooted in earthy, sun-baked tones contrasted with vibrant functional accents.
- **Primary (Terracotta):** `#f17350` used for core actions and brand identity.
- **Secondary (Teal):** `#41B3A3` used for community elements and "trust" indicators.
- **Tertiary (Marigold/Pink):** `#F64C72` used for urgent notifications and "hot" status items.
- **Neutral (Paper & Ink):** The base is `#FDFBF7` (Paper), with text in `#2D3142` (Ink).

**The "No-Line" Rule:**
Structural separation is achieved through tonal shifts rather than 1px borders. Use the transition from `surface` to `surface_container` to define sections. Borders, if absolutely necessary, should be `stone/10` or `stone/20` (opacity-based) to ensure they feel like shadows of folds rather than rigid dividers.

**The "Glass & Gradient" Rule:**
Floating interactive elements (like favorite buttons or tags) should utilize backdrop blurs (20px+) and semi-transparent white fills (`rgba(255, 255, 255, 0.8)`) to maintain depth without breaking the "Paper" substrate.

### 3. Typography
Mitti Modern uses **Work Sans** across all levels to maintain a clean yet friendly personality. The scale is intentionally rhythmic and expressive.

- **Display/Headline 1 (30px/1.875rem):** Bold, leading-tight. Used for Hero statements.
- **Headline 2 (24px/1.5rem):** Bold, tracking-tight. Used for section titles.
- **Title (20px/1.25rem):** Bold. Used for card headings.
- **Body (16px/1rem):** Normal weight. Used for general descriptions.
- **Label/Small (14px - 10px):** Semi-bold for metadata and tags.

The typography scale avoids the standard 2px increments, opting for larger jumps (e.g., 24px to 30px) to create high-contrast editorial hierarchies.

### 4. Elevation & Depth
Depth is created through **Warm Layering** rather than cold drop shadows.

- **The Layering Principle:** Stacking is defined by container tiers. `surface_container_lowest` is used for the most elevated interactive cards, while `surface` is the base earth.
- **Ambient Shadows:** 
  - **Card Shadow:** `0 4px 12px rgba(45, 49, 66, 0.04)` — nearly invisible, providing just enough lift.
  - **Warm Glow:** `0 12px 32px rgba(241, 115, 80, 0.15)` — used exclusively for hovered states or primary CTAs to create a "halo" effect.
- **Mitti Noise:** A 3% opacity fractal noise overlay is applied to the entire viewport to give the interface a physical, paper-like texture.

### 5. Components
- **Bazaar Cards:** Rounded (24px), with a 3px internal padding for the image. On hover, cards must transform (`translateY(-8px)`) and rotate slightly (`rotate(2deg)`) to mimic the feeling of picking up a physical object.
- **Pill Navigation:** High-contrast buttons with maximum roundedness. Active states use the Primary Terracotta with a shadow; inactive states use a subtle stone-tinted border.
- **Search Bar:** Fully rounded (pill) with a `shadow-sm` and no visible border, blending into the header white space.
- **Status Chips:** Small, uppercase, bold. Use `marigold` for alerts and `teal` for positive proximity indicators.

### 6. Do's and Don'ts
**Do:**
- Use masonry layouts for content discovery to encourage browsing.
- Apply `rounded-full` to all buttons and input fields.
- Use intentional whitespace (Spacing Level 3) to let high-quality imagery breathe.
- Mix serif-like weights (Bold Work Sans) with plenty of tracking-tight settings for headlines.

**Don't:**
- Never use pure black `#000000`. Use `Ink` (`#2D3142`).
- Avoid sharp corners; the minimum radius for small elements is 8px, and 24px for containers.
- Do not use solid heavy dividers. Use `stone/10` or simple background color changes.
- Avoid generic icons; use Material Symbols with a "Rounded" or "Sharp" theme consistently.