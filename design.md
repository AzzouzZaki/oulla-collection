---
name: oulla-design-system
description: >
  Design system and brand guidelines for the Oulla Collection e-commerce store (L'Essence d'Oulla).
  Use this skill whenever working on the public-facing store UI — product pages, homepage, navigation,
  cards, buttons, forms, or any visual component for the storefront. Also trigger when generating
  Figma MCP prompts, agent prompts for store pages, or any front-end code for the (store) route group.
  Do NOT apply to the admin panel (which uses its own separate utility-first token system).
---

# L'Essence d'Oulla — Design System

Brand philosophy: **Modern Modest Luxury** — Algerian heritage meets contemporary editorial aesthetics.
Visual style: **Editorial Minimalism** — experience should feel like a high-end fashion magazine.

---

## Color Tokens

```
Background / Surface:
  --surface:                   #faf9f6   (main canvas, warm off-white)
  --surface-container-lowest:  #ffffff
  --surface-container-low:     #f4f3f1
  --surface-container:         #efeeeb
  --surface-container-high:    #e9e8e5
  --surface-container-highest: #e3e2e0
  --surface-dim:               #dbdad7
  --on-surface:                #1a1c1a   (charcoal, primary text)
  --on-surface-variant:        #4e453a
  --inverse-surface:           #2f312f
  --inverse-on-surface:        #f2f1ee
  --outline:                   #807569
  --outline-variant:           #d1c5b6

Primary (Gold):
  --primary:                   #775928
  --on-primary:                #ffffff
  --primary-container:         #b08d57
  --on-primary-container:      #3d2700
  --inverse-primary:           #e8c086
  --primary-fixed:             #ffdeae
  --primary-fixed-dim:         #e8c086
  --on-primary-fixed:          #281800
  --on-primary-fixed-variant:  #5d4213
  --surface-tint:              #775928

Secondary (Blush):
  --secondary:                 #70585b
  --on-secondary:              #ffffff
  --secondary-container:       #f8d8db
  --on-secondary-container:    #755d5f
  --secondary-fixed:           #fbdbde
  --secondary-fixed-dim:       #debfc2
  --on-secondary-fixed:        #281719
  --on-secondary-fixed-variant:#574144

Tertiary (Neutral Grey):
  --tertiary:                  #5f5e5e
  --on-tertiary:               #ffffff
  --tertiary-container:        #949292
  --on-tertiary-container:     #2c2b2b
  --tertiary-fixed:            #e5e2e1
  --tertiary-fixed-dim:        #c8c6c5
  --on-tertiary-fixed:         #1c1b1b
  --on-tertiary-fixed-variant: #474746

Error:
  --error:                     #ba1a1a
  --on-error:                  #ffffff
  --error-container:           #ffdad6
  --on-error-container:        #93000a
```

---

## Typography

Two fonts only. Always load from Google Fonts.

| Token            | Family      | Size   | Weight | Line-H | Letter-Spacing | Usage                          |
|------------------|-------------|--------|--------|--------|----------------|-------------------------------|
| display-lg       | Bodoni Moda | 64px   | 600    | 1.1    | -0.02em        | Hero headlines (desktop)      |
| display-lg-mobile| Bodoni Moda | 40px   | 600    | 1.2    | —              | Hero headlines (mobile)       |
| headline-lg      | Bodoni Moda | 48px   | 500    | 1.2    | —              | Section titles (desktop)      |
| headline-lg-mobile| Bodoni Moda| 32px   | 500    | 1.3    | —              | Section titles (mobile)       |
| headline-md      | Bodoni Moda | 32px   | 500    | 1.4    | —              | Subsection headings           |
| body-lg          | DM Sans     | 18px   | 400    | 1.6    | —              | Descriptions, editorial copy  |
| body-md          | DM Sans     | 16px   | 400    | 1.5    | —              | Product details, UI text      |
| label-sm         | DM Sans     | 12px   | 700    | 1.2    | 0.1em          | Uppercase labels, buttons     |

**Rules:**
- Labels and small buttons → always UPPERCASE
- Editorial pull-quotes → display-lg with tight letter-spacing
- Never mix Bodoni Moda into body copy or UI labels

---

## Layout & Grid

```
Desktop (1440px+): 12-col grid, 64px margins, 24px gutters
Tablet (768–1024px): 8-col grid, 40px margins
Mobile (<768px): 4-col grid, 20px margins

Container max-width: 1280px
Section vertical gap: 120px (generous — never compress)
Base spacing unit: 8px
```

---

## Elevation & Depth

No heavy gradients. Depth via tonal layers only.

1. **Base layer:** `#faf9f6` (--surface)
2. **Elevated cards:** `#ffffff` — used sparingly for product focus
3. **Shadows:** `box-shadow: 0 20px 40px rgba(26, 26, 26, 0.04)` — ultra-diffused only
4. **Borders:** 1px hairline in `--primary` (gold) or `--outline-variant` (light charcoal)

---

## Shape Language

**0px border-radius everywhere.** No exceptions.

Sharp corners = architectural precision + high-fashion tailoring. This is a deliberate brand differentiator. Never use rounded corners, even on mobile or interactive states.

---

## Components

### Buttons
| Variant  | Background      | Text            | Border          | Hover                        |
|----------|----------------|-----------------|-----------------|------------------------------|
| Primary  | `--on-surface` (#1a1c1a, charcoal) | `#fff` uppercase | none | Gold underline (1px `--primary`) |
| Secondary| transparent     | `--primary` gold | 1px `--primary` | subtle bg tint               |
| Ghost    | transparent     | `--on-surface`  | none (1px underline only) | —               |

All buttons: 0px radius, `label-sm` font style, generous horizontal padding.

### Input Fields
- Bottom-border only (no box border)
- Label above in `label-sm` style
- Focus transition: border-bottom `--outline-variant` → `--primary` (gold)
- 0px radius

### Product Cards
- Image-centric, no visible border
- Product name: Bodoni Moda (headline-md weight)
- Price: DM Sans body-md
- Significant padding below image before text
- "Quick Add" button: **hover-only overlay**, hidden at rest to keep view pristine
- No card border; rely on whitespace for separation

### Chips & Filters
- Uppercase DM Sans text tags
- Active state: `--secondary-container` (blush) background OR gold bottom-line indicator
- No pill/rounded shape — stay flat and sharp
- Avoid heavy borders

### Navigation
- Centered, persistent top nav
- High letter-spacing on menu items (≥0.08em)
- Mega menu for collections: imagery + category links side by side (editorial feel)

---

## Key Design Principles (for agent prompts)

1. **Breathing room over density** — generous whitespace is a feature, not wasted space
2. **Photography first** — UI frames the product; it should never compete with it
3. **Sharp always** — 0px radius is non-negotiable brand language
4. **Gold sparingly** — primary gold is for key brand moments and CTAs only, not decoration
5. **Bodoni for impact, DM Sans for everything else** — never swap these roles
6. **Mobile-first code, magazine-first design** — fluid on mobile, fixed-grid editorial on desktop

---

## Separation from Admin Panel

The admin panel uses its own token system (`#18181B` primary, indigo accent `#6366F1`, Inter font).
**Never mix admin tokens into store components or vice versa.**