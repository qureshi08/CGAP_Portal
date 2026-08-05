# Logo Usage

## The marks

CBT has two related logos in active use. Both files live in [`assets/logos/`](assets/logos/)
and are exact copies of what's deployed in the product (`public/logo.png`,
`public/cgap-logo.png`, `public/favicon.png` in the portal codebase).

### 1. Primary CBT logo — `cbt-logo-primary.png`

A green square containing a lowercase white "cbt" mark, followed by the full wordmark
"Convergent Business Technologies" set in the primary green.

- **File dimensions:** 1024 × 372 px (PNG, transparent background)
- **Aspect ratio:** ~2.75 : 1
- **In the product:** rendered at 32px height × 96px width (`h-8 w-24` in Tailwind terms),
  scaling to 1.02× on hover. See `src/components/Logo.tsx`.
- **Use for:** header/navigation, footer, any context where the full company name should
  read clearly (documents, email signatures, presentation title slides).

### 2. Icon mark / favicon — `cbt-favicon-mark.png`

The green square with the white "cbt" wordmark, isolated — no company name text.

- **File dimensions:** 875 × 875 px (PNG, square, transparent-free background — solid
  green with a slightly darker green keyline border)
- **Use for:** browser tab favicon, app icons, social profile pictures, anywhere space is
  too tight for the full wordmark (e.g. a 32×32 favicon, a Slack/Teams icon).
- **Do not** stretch this to a non-square aspect ratio — it's designed as a 1:1 mark.

### 3. CGAP program logo — `cgap-program-logo.png`

A sub-brand mark for the Convergent Graduate Academy Program: the same green square, this
time containing a white "C", followed by "GAP" in dark charcoal.

- **File dimensions:** 1024 × 281 px (PNG, transparent background)
- **Use for:** anything specifically about the graduate program — recruitment materials,
  the public application landing page, CGAP-specific email headers. Do not use this in
  place of the primary CBT logo for general company communications.

## Clear space

Maintain clear space around every logo equal to at least the height of the green square
icon within it. For the primary logo at its typical 32px-tall usage, that's roughly 32px of
breathing room on all sides — don't crop text, buttons, or other UI elements directly against
the logo.

## Minimum size

- **Primary logo (with wordmark):** don't render below ~24px tall. Below that, the
  "Convergent Business Technologies" wordmark stops being legible.
- **Icon mark alone:** can go as small as 16px (standard favicon size) since it has no
  small text to lose legibility.

## Backgrounds

- The primary and CGAP logos both work on **white or light (`#F7F8F7` "Bone") backgrounds
  only** — this is the only context they're used in throughout the current product.
- **There is currently no version of the logo designed for dark backgrounds.** If you need
  the logo on a dark background (a dark-themed slide, a black tote bag, a dark social
  banner), don't just invert the colors in an image editor — get a proper reversed version
  designed, since the green may not read correctly at reduced contrast. See the "Known gaps"
  note in the kit's [`README.md`](README.md).

## Do

- Use the exact PNG files provided — don't recreate the logo from scratch in a different
  tool, even if it looks similar.
- Keep the green square and its icon glyph together as a single unit; never separate them.
- Use the icon-only mark (`cbt-favicon-mark.png`) when space is too tight for the wordmark.

## Don't

- Don't recolor the logo. The green is specific (`#00994D` — see
  [`03-color-palette.md`](03-color-palette.md)) and recoloring breaks brand recognition.
- Don't add drop shadows, outlines, or other effects to the logo.
- Don't place the logo on a busy photo or textured background where it loses contrast.
- Don't stretch or skew either logo — always scale proportionally.
- Don't use the CGAP logo as a substitute for the primary CBT logo in general company
  communications, or vice versa.
