# UI Component Reference

> **Drop-in version:** every class below is already implemented and ready to use in
> [`tokens/components.css`](tokens/components.css) — e.g. `<button class="cbt-btn
> cbt-btn-primary">`. Link it alongside `tokens/tokens.css` and you don't need to
> recreate any of this by hand.

Exact specs for the component patterns used throughout the CBT product. Use this when
producing anything that needs to visually match the brand — a marketing one-pager, a
partner deck screenshot mockup, or new in-app UI in a different project.

## Buttons

| Class | Appearance | Hover |
|---|---|---|
| `.btn-primary` | Green (`#00994D`) background, white text, 600 weight, 13px, `10px 22px` padding, 6px radius | Background darkens to `#007A3D`, lifts 1px |
| `.btn-primary-v2` | Ink (`#111827`) background, white text — same sizing as primary | Background transitions to primary green, lifts 1px |
| `.btn-secondary` | Transparent background, 2px green border, green text | Background tints to `rgba(0,153,77,0.05)`, lifts 1px |
| `.btn-outline` | Transparent background, 2px green border, green text | Fills solid green, text turns white, lifts 1px |
| `.btn-ghost` | No background, Graphite (`#374151`) text, underline offset 3px, 500 weight | Text turns primary green |
| `.btn-cta-white` | White background, Ink text, 14px, 600 weight, `12px 28px` padding, 7px radius | Fills primary green, text turns white, lifts 1px |

**Rule of thumb:** one `.btn-primary` per view for the single most important action. Every
other action should be `.btn-secondary`, `.btn-outline`, or `.btn-ghost` — never two solid
green buttons competing in the same view.

## Cards

| Class | Padding | Radius | Notes |
|---|---|---|---|
| `.card` | 1.75rem (28px) | 12px | Standard content card. White bg, 1px `#E2E8E4` border, soft shadow. Hover: premium shadow + lifts 3px |
| `.card-compact` | 1.25rem (20px) | 11px | Smaller/denser card variant. Hover border turns primary green |
| `.v2-pc` | `22px 20px` | 13px | Flex-column "pillar card" pattern, used for feature/service tiles |
| `.v2-stile` | 20px | 11px | Compact stat/service tile |

Icon containers within cards (`.v2-pc-icon`, `.v2-stile-icon`) are small squares (36–38px),
9px/8px radius, tinted background (`#E6F5ED` or `#F7F8F7`), icon rendered in primary green.

## Forms

- **`.input-field`** — full width, `8px 12px` padding, 1px `#E2E8E4` border, 6px radius, DM
  Sans 14px/500. On focus: border turns primary green, plus a soft green focus ring
  (`0 0 0 3px rgba(0,153,77,0.15)`).
- **`.form-label`** — block display, 14px/500, Graphite (`#374151`) color, 6px bottom margin.

## Status badges

- **`.status-badge`** — pill shape (`border-radius: 999px`), `3px 9px` padding, 10px text,
  600 weight, uppercase, `0.06em` letter-spacing. Default: Bone background, muted border,
  body-color text.
- **`.status-badge-primary`** — same shape, tinted green: `#E6F5ED` background,
  `rgba(0,153,77,0.25)` border, `#007A3D` text.

Use badges for status/state (Applied, Approved, Selected, etc.) — never plain colored text
for status, always the pill treatment.

## Pull-quotes / callouts

**`.pull-quote`** (also used as `.v2-testi`) — `#E6F5ED` background, 3px solid green
left-border, `border-radius: 0 12px 12px 0` (square on the accented side, rounded on the
other three corners), 22px padding. This is also the pattern to reuse for any "important
note" callout in brand materials — it's the same visual language used for the deadline
callout in the selection email (just with red instead of green for urgency, see
[`05-voice-and-tone.md`](05-voice-and-tone.md)).

## Spacing scale

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |

## Border radii

| Token | Value | Use for |
|---|---|---|
| `--radius-sm` | 6px | Buttons, inputs |
| `--radius-md` | 12px | Cards, modals |
| `--radius-lg` | 16px | Large containers |

## Layout

- **Container widths:** `--container-max` 1200px (standard), `--container-wide` 1440px,
  `--container-prose` 720px (reading-width text blocks)
- **Grid:** 12-column desktop, 8-column tablet, 4-column/single mobile
- **Breakpoints:** 640 / 768 / 1024 / 1280 / 1536 px

## Motion

Transitions use three speeds — `0.15s` (fast, micro-interactions like hover), `0.2s`
(base), `0.35s` (slow, larger reveals) — all on an `cubic-bezier(0.22, 1, 0.36, 1)` easing
curve. Animations are always subtle, staggered reveals; never anything aggressive or
attention-grabbing, and `prefers-reduced-motion` is always respected (animations collapse to
near-instant for users who've requested reduced motion).

## Icons

[Lucide](https://lucide.dev) icon set exclusively, `stroke-width: 1.5`, default size 24px
(scaled down for inline/small contexts, e.g. 12–16px in badges and labels).
