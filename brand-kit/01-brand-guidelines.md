# Brand Guidelines

## Who CBT is

Convergent Business Technologies (CBT) is a Data, Cloud & AI consultancy. The brand needs to
read as credible to enterprise clients and global partners, while also feeling approachable
to the graduate talent it recruits through the Convergent Graduate Academy Program (CGAP).
That dual audience is the central tension the brand identity is designed to resolve.

## Visual style: "Editorial Intelligence"

The design language across the product is best described as **editorial intelligence** —
clean, high-contrast, and structural, borrowing more from print editorial design (serif
display type, generous whitespace, restrained color) than from typical SaaS-dashboard
visual language (heavy borders, dense grids, saturated color blocks).

In practice this means:

- **Minimal borders.** Sections are separated by alternating background tones (white and
  `#F7F8F7` "Bone"), not 1px dividing lines. Borders are reserved for cards, inputs, and
  small components — not page-level layout.
- **Restraint over decoration.** One primary accent color (`#00994D` green) carries almost
  all visual emphasis. There is no secondary "brand color" competing for attention.
- **Serif headings, sans body.** Playfair Display (serif) is used exclusively for headings
  and editorial emphasis; DM Sans (sans-serif) carries everything else. The contrast between
  the two is a deliberate signature of the brand, not an accident — see
  [`04-typography.md`](04-typography.md).
- **Subtle motion only.** Animations are short, staggered reveals — never aggressive or
  attention-grabbing. `prefers-reduced-motion` is always respected.

## Tone of voice

**Confident but accessible. Smart but not cold.**

This shows up differently depending on the audience:

- **To candidates:** warm, respectful, and clear. Never bureaucratic. A rejection email
  still thanks the person and encourages them to apply again — see
  [`05-voice-and-tone.md`](05-voice-and-tone.md) for full annotated examples.
- **To enterprise clients and partners:** precise and outcome-focused. Confidence comes from
  clarity, not from adjectives.
- **In the product UI:** short, scannable copy. Labels are uppercase and tracked-out
  (`letter-spacing`) rather than bolded and long — this is a deliberate typographic choice
  that recurs across the entire interface (see `.section-tag`, `.uppercase-label` in
  [`06-ui-components.md`](06-ui-components.md)).

## Audiences

| Audience | What they need from the brand |
|---|---|
| **Enterprise clients** | Evidence of technical rigor and reliability. The editorial, uncluttered visual style signals "we don't need to shout." |
| **Global partners** | Consistency and polish — a brand that looks the same whether they're reading an email, a proposal, or the recruitment portal. |
| **Graduate talent (CGAP candidates)** | Approachability without losing credibility. The tone in candidate-facing emails is the single best expression of this — formal enough to trust, warm enough to feel welcomed. |

## Do

- Use the primary green (`#00994D`) as the single dominant accent color. Let neutrals do the
  rest of the work.
- Let whitespace and section-background alternation do the job that borders would otherwise do.
- Default candidate-facing copy to the warm-but-precise tone documented in
  [`05-voice-and-tone.md`](05-voice-and-tone.md) — don't write like a generic automated system.
- Keep motion subtle. If an animation calls attention to itself, it's too much.

## Don't

- Don't introduce a second "brand color" for emphasis — everything competing with the green
  accent dilutes it.
- Don't add heavy borders or dividing lines between page sections — use background-tone
  alternation instead.
- Don't write candidate-facing copy in a cold, purely transactional tone (e.g. "Your
  application status has been updated to: REJECTED"). Every template that exists today reads
  like a person wrote it, not a system.
- Don't invent new colors, fonts, or spacing values for one-off use — the existing scale
  (documented in [`03-color-palette.md`](03-color-palette.md),
  [`04-typography.md`](04-typography.md)) covers essentially every real need in the product.
