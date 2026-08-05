# Typography

> **Drop-in version:** link [`tokens/fonts.css`](tokens/fonts.css) to load these exact
> webfonts, and [`tokens/tokens.css`](tokens/tokens.css) for the `--cbt-font-*` variables
> and full type scale — no need to hunt down the right Google Fonts URL yourself.

## Font families

Three typefaces, each with a strict role. Never mix their roles — e.g. never use Playfair
Display for a button label, or DM Sans for a hero headline.

| Role | Typeface | CSS variable | Where it comes from |
|---|---|---|---|
| **Editorial headings** | Playfair Display (serif) | `--font-heading` | Google Fonts, imported in `src/app/layout.tsx` |
| **UI & body text** | DM Sans (sans-serif) | `--font-body` (aliased as `--font-sans` in the design tokens) | Google Fonts, imported in `src/app/layout.tsx` |
| **Monospace / code** | JetBrains Mono | `--font-mono` | Used for technical/code-like content only |

Fallback stacks:
- Heading: `"Playfair Display", Georgia, serif`
- Body: `"DM Sans", "Helvetica Neue", sans-serif`
- Mono: `"JetBrains Mono", "Courier New", monospace`

The contrast between the serif heading font and sans-serif body font is a deliberate,
recurring brand signature — it's what gives the product its "editorial" feel rather than a
typical flat SaaS look. Many headings in the product also use an **italic** treatment of
Playfair Display for emphasis (see `.italic-accent` in
[`06-ui-components.md`](06-ui-components.md)) — this italic-serif-accent pattern shows up
across almost every page title in the app and is worth reusing in brand materials.

## Type scale

| Token | Size | Pixels | Typical use |
|---|---|---|---|
| `--text-xs` | 0.75rem | 12px | Labels, legal/fine print |
| `--text-sm` | 0.875rem | 14px | Captions, metadata |
| `--text-base` | 1rem | 16px | Default body text |
| `--text-lg` | 1.125rem | 18px | Lead paragraphs |
| `--text-xl` | 1.25rem | 20px | Card titles |
| `--text-2xl` | 1.5rem | 24px | Section subtitles |
| `--text-3xl` | 1.875rem | 30px | Section headings |
| `--text-4xl` | 2.25rem | 36px | Page titles |
| `--text-5xl` | 3rem | 48px | Hero headings |
| `--text-6xl` | 3.75rem | 60px | Large hero display |

## Weights

- **DM Sans:** 400 for body copy, 500 for labels, 600 for buttons and emphasis, 700 for
  strong/bold text.
- **Playfair Display:** 600 for smaller headings (h4–h6), 700 for larger headings and hero
  display type.

## Recurring typographic utility patterns

These small conventions repeat across nearly every screen in the product and are worth
matching in any new brand material:

- **`.section-tag`** — small eyebrow label above a heading. 11px, weight 600, uppercase,
  `letter-spacing: 0.1em`. Example: "CONTROLS" above "System Settings."
- **`.uppercase-label`** — the same uppercase/tracked-out treatment used generally for
  small labels (status badges, form field labels, table headers) instead of relying on bold
  weight alone.
- **`.section-heading`** — `font-size: clamp(1.6rem, 2.5vw, 2.2rem)`, weight 700,
  `letter-spacing: -0.02em`, set in the heading font. Fluid/responsive by design.
- **`.italic-accent`** — a word or phrase within a heading rendered in italic Playfair
  Display and the primary green color, for emphasis (e.g. "Executive **Overview**" or
  "Talent **Pool**" where the bold word is the italic-accent). This is the single most
  distinctive typographic signature in the product — use it for the "accent word" in any
  new headline.

## Applying this outside the product

For slide decks, one-pagers, or printed materials:

- **Titles/headlines:** Playfair Display, bold, optionally with one accent word in italic +
  primary green (mirroring `.italic-accent`).
- **Body copy:** DM Sans, regular weight, `#374151` (Graphite).
- **Small labels/eyebrows:** DM Sans, 600 weight, uppercase, letter-spacing loosened — never
  just "bold" without the uppercase+tracking treatment; that combination is the brand's
  labeling signature, not bold text alone.
