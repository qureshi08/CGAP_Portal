# Color Palette

> **Drop-in version:** every value below is already implemented as a ready-to-use CSS
> custom property in [`tokens/tokens.css`](tokens/tokens.css) (and as JSON in
> [`tokens/tokens.json`](tokens/tokens.json)). Link that file into any project instead of
> retyping these hex values by hand.

These are the exact colors used throughout the CBT product. When building new UI, always
reference the variable/Tailwind class (`var(--cbt-primary)` or `bg-primary`), never hardcode
a hex value inline — that way, if the palette ever needs to shift, one edit to
`tokens.css` updates everywhere it's used.

## Primary palette

| Swatch | Name | Hex | CSS variable | Use for |
|---|---|---|---|---|
| 🟩 | CBT Botanical Green (Primary) | `#00994D` | `--color-primary` | The one dominant brand accent — buttons, links, active states, the logo mark |
| 🟩 | Primary Light | `#00C060` | `--color-primary-light` | Rarely used lighter accent variant |
| 🟩 | Primary Dark | `#007A3D` | `--color-primary-dark` | Hover/active state for primary green elements |
| 🟩 | Primary Muted | `#E6F5ED` | `--color-primary-muted` | Very light tint for badges, highlighted rows, subtle backgrounds |

## Neutrals

| Swatch | Name | Hex | CSS variable | Use for |
|---|---|---|---|---|
| ⬜ | White | `#FFFFFF` | `--color-white` | Base background, card backgrounds |
| ⬜ | Surface / Bone | `#F7F8F7` | `--color-surface` | Alternate section background (used instead of dividing lines) |
| ⬛ | Border / Muted Grey | `#E2E8E4` | `--color-border` | Card borders, input borders — used sparingly |
| ⬛ | Muted / Steel | `#6B7280` | `--color-muted` | Secondary/caption text |
| ⬛ | Body / Graphite | `#374151` | `--color-body` | Primary body copy |
| ⬛ | Heading / Ink | `#111827` (product) / `#0C1A10` (design-system doc) | `--color-heading` | Headings, high-contrast text |
| ⬛ | Dark / Ink (deep) | `#0C1A10` | `--color-dark` | Deepest ink tone for maximum contrast contexts |
| ⬛ | Footer | `#0e0e0e` | `--color-footer` | Footer background where used |

> Note: two closely related dark values appear in the codebase — `#111827` (Tailwind config
> `heading`) and `#0C1A10` (globals.css `--color-dark` / the design-system skill doc). Both
> are near-black "ink" tones used for headings/high-contrast text; treat them as
> interchangeable "brand ink" rather than two distinct brand colors.

## Status colors

| Swatch | Name | Hex | Use for |
|---|---|---|---|
| 🟩 | Success | `#00994D` | Same as primary green — success states reuse the brand color rather than introducing a separate green |
| 🟧 | Warning | `#F59E0B` | Amber warnings, "pending" states |
| 🟥 | Error | `#EF4444` | Errors, destructive actions, rejections |
| 🟦 | Info | `#3B82F6` | Informational banners/badges |

## Shadows (tinted with brand color)

CBT's elevation system deliberately tints shadows with the primary green rather than using
neutral grey/black shadows — this is part of what gives the product its "premium" feel.

| Token | Value | Use for |
|---|---|---|
| `--shadow-soft` | `0 1px 4px rgba(0,0,0,0.06)` | Default resting shadow on cards |
| `--shadow-premium` | `0 12px 40px rgba(0,153,77,0.09)` | Hover/elevated state — green-tinted |
| `--shadow-deep` | `0 12px 40px rgba(0,153,77,0.12)` | Stronger elevated state |
| `--shadow-nav` | `0 2px 16px rgba(0,0,0,0.06)` | Navigation bar |
| `--shadow-dropdown` | `0 12px 40px rgba(0,0,0,0.08)` | Dropdowns, popovers |

## Usage principle

Borders are used sparingly and only at the component level (cards, inputs, small UI
elements) — never to separate whole page sections. Page-level structure comes from
alternating **White** and **Bone (`#F7F8F7`)** backgrounds instead. This is a deliberate,
recurring pattern across the entire product — don't add a section divider border where a
background-tone change would do the job.
