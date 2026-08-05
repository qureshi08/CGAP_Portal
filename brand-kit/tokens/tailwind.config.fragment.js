/**
 * Convergent Business Technologies — Tailwind config fragment
 * ─────────────────────────────────────────────────────────────────────────
 * Not a standalone config — a copy-paste fragment. Merge this into your
 * own tailwind.config.js/ts under `theme.extend`:
 *
 *   const cbtTheme = require('./brand-kit/tokens/tailwind.config.fragment.js');
 *
 *   module.exports = {
 *     theme: {
 *       extend: {
 *         ...cbtTheme,
 *         // ...your own extensions
 *       },
 *     },
 *   };
 *
 * After merging, use the tokens as normal Tailwind utility classes:
 *   <button class="bg-primary text-white hover:bg-primary-hover rounded-md">
 *   <h1 class="font-heading text-4xl text-heading">
 *
 * Also load tokens/fonts.css (or your own font-loading strategy) so
 * "Playfair Display" / "DM Sans" / "JetBrains Mono" actually resolve —
 * this fragment only tells Tailwind the family NAMES to use, it doesn't
 * load the font files itself.
 */

module.exports = {
  colors: {
    primary: {
      DEFAULT: '#00994D',
      hover: '#007A3D',
      light: '#00C060',
      muted: '#E6F5ED',
    },
    heading: '#0C1A10',
    body: '#374151',
    muted: '#6B7280',
    surface: {
      DEFAULT: '#FFFFFF',
      alt: '#F7F8F7',
    },
    border: '#E2E8E4',
    success: '#00994D',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  fontFamily: {
    heading: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
    body: ['"DM Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
    mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
  },
  boxShadow: {
    soft: '0 1px 4px rgba(0, 0, 0, 0.06)',
    premium: '0 12px 40px rgba(0, 153, 77, 0.09)',
    deep: '0 12px 40px rgba(0, 153, 77, 0.12)',
    nav: '0 2px 16px rgba(0, 0, 0, 0.06)',
    dropdown: '0 12px 40px rgba(0, 0, 0, 0.08)',
  },
  maxWidth: {
    'container-max': '1200px',
    'container-wide': '1440px',
    'container-prose': '720px',
  },
  transitionTimingFunction: {
    cbt: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
};
