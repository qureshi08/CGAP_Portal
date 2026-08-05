# Convergent Business Technologies — Brand Kit

This whole folder is self-contained and portable. Copy `brand-kit/` into any project — a
new website, a different app, a marketing microsite, anything — and everything in it works
immediately, with no dependency on the CBT Recruitment Portal codebase it was extracted
from. It bundles both the **guidelines** (how to think about the brand) and the **implementation**
(actual CSS/JSON/Tailwind files you can wire in directly), so you don't have to manually
retype a single hex code into a new project.

## Quick start (drop this into a new project)

**Plain HTML / any framework — 3 lines, no build step:**

```html
<link rel="stylesheet" href="brand-kit/tokens/fonts.css">
<link rel="stylesheet" href="brand-kit/tokens/tokens.css">
<link rel="stylesheet" href="brand-kit/tokens/components.css">
```

That's it — you now have every CBT color/spacing/shadow as a `--cbt-*` CSS variable, the
real Playfair Display / DM Sans / JetBrains Mono fonts loading, and ready-made classes like
`cbt-btn-primary`, `cbt-card`, `cbt-badge`. See [`tokens/components.css`](tokens/components.css)
for the full class list.

**Tailwind projects:**

```js
const cbtTheme = require('./brand-kit/tokens/tailwind.config.fragment.js');
module.exports = { theme: { extend: { ...cbtTheme } } };
```

Then use normal Tailwind classes: `bg-primary`, `font-heading`, `shadow-premium`, etc.
See [`tokens/tailwind.config.fragment.js`](tokens/tailwind.config.fragment.js).

**Anything else (Figma, mobile apps, Style Dictionary, design tools):**

Read the values straight out of [`tokens/tokens.json`](tokens/tokens.json) — plain JSON,
no CSS required.

## What's in here

| File | Use it for |
|---|---|
| [`01-brand-guidelines.md`](01-brand-guidelines.md) | Mission, positioning, personality, audiences — the "why" behind every design decision |
| [`02-logo-usage.md`](02-logo-usage.md) | Logo files, clear space, minimum size, do's and don'ts |
| [`03-color-palette.md`](03-color-palette.md) | Every brand color explained — pairs with `tokens/tokens.css` |
| [`04-typography.md`](04-typography.md) | Font families, type scale, weight usage — pairs with `tokens/fonts.css` |
| [`05-voice-and-tone.md`](05-voice-and-tone.md) | How CBT writes — with real annotated email examples |
| [`06-ui-components.md`](06-ui-components.md) | Button, card, form, badge specs — pairs with `tokens/components.css` |
| [`brand-book.html`](brand-book.html) | A single-page visual tour of everything below — open it directly in a browser |
| [`assets/logos/`](assets/logos/) | The actual logo files (PNG), ready to drop into a document, slide deck, or new project |
| [`tokens/tokens.css`](tokens/tokens.css) | **Drop-in.** Every color/spacing/shadow/type-scale value as a CSS custom property |
| [`tokens/fonts.css`](tokens/fonts.css) | **Drop-in.** Loads the real Playfair Display / DM Sans / JetBrains Mono webfonts |
| [`tokens/components.css`](tokens/components.css) | **Drop-in.** Ready-made `.cbt-btn-primary`, `.cbt-card`, `.cbt-badge`, etc. classes |
| [`tokens/tokens.json`](tokens/tokens.json) | **Drop-in.** Same values as plain JSON, for non-CSS tooling |
| [`tokens/tailwind.config.fragment.js`](tokens/tailwind.config.fragment.js) | **Drop-in.** Copy-paste `theme.extend` block for Tailwind projects |

The markdown docs (01–06) explain the *why* and the reasoning behind each decision; the
`tokens/` folder is the *drop-in* implementation of the same values. Update both together if
the brand ever changes — they're meant to always match.

## Quick reference

- **Primary color:** `#00994D` (CBT Botanical Green)
- **Headings font:** Playfair Display (serif, editorial)
- **Body/UI font:** DM Sans (sans-serif)
- **Voice:** Confident but accessible. Formal enough for an enterprise consultancy, warm enough that a graduate candidate doesn't feel like a case number.
- **Visual style:** "Editorial Intelligence" — clean, high-contrast, structural. Minimal borders; alternating white/bone (`#F7F8F7`) backgrounds define sections instead of lines.

## Provenance (optional background, not a dependency)

Everything in this kit was extracted from the live CBT Recruitment Portal product, not
invented — that's what makes it trustworthy to reuse. You don't need access to that
codebase to use this kit (everything you need is self-contained above), but for reference,
here's where the values originally came from:

- Colors, spacing, and type scale: that product's `src/app/globals.css` (`@theme` block) and `tailwind.config.ts`
- Fonts: that product's `src/app/layout.tsx` (Google Fonts imports)
- Logo files: that product's `public/logo.png`, `public/cgap-logo.png`, `public/favicon.png`
- Voice examples: real email templates in that product's `src/lib/email.ts`
- That codebase also has a terser, developer-facing version of these same tokens at
  `.agents/skills/cbt_design_system/SKILL.md`, used by AI coding tools working in that
  specific repo. This brand kit is the portable, complete counterpart — usable anywhere,
  not just in that one codebase.

If the source product's design system changes in the future, someone should re-sync this
kit against it so the two don't quietly drift apart.

## Known gaps (things this kit does NOT include, and why)

- **No vector master files (SVG/EPS/AI).** The only source files available were flattened
  PNGs (`logo.png`, `cgap-logo.png`, `favicon.png`). If you need a scalable vector logo (for
  large-format printing, a die-cut sticker, etc.), the original design file will need to be
  recovered from whoever first designed the mark, or redrawn by a designer.
- **No reversed/white logo for dark backgrounds.** Every current use of the logo is on a
  white or near-white background — there's no dark-mode variant in use anywhere, so none
  exists to extract. If you need one (e.g. a dark-themed slide deck or a black letterhead),
  it should be designed fresh rather than approximated.
- **No print-specific guidelines** (CMYK values, paper stock, etc.) — this kit documents the
  digital/web brand only, since that's the only context the source product actually uses.
