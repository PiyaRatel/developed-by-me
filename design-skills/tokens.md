# Design tokens

Tokens are design decisions with names. A token records *why* a value is used, not just the value. `color-action` means "this is what you can press". `#3b4bdb` means nothing.

Source: `tokens/tokens.json` (DTCG format). Output: `app/tokens.css`, built by `npm run tokens`, which runs on its own before `dev` and `build`. Never edit `app/tokens.css` by hand.

## The three tiers

| Tier | Example | Who uses it | Changes when |
| --- | --- | --- | --- |
| Primitive | `--color-ink-900`, `--radius-l` | Only the semantic and component tiers | The palette itself changes |
| Semantic | `--color-text`, `--color-action`, `--space-4` | All component CSS | The theme or density changes |
| Component | `--button-bg`, `--card-radius` | One component | That one component needs to diverge |

**The rule:** component CSS reads semantic or component tokens. It never reads a primitive. If you write `var(--color-ink-600)` in `globals.css`, you have hard-coded light mode, because the dark theme can't reach it.

## Colour

Semantic colours exist in three themes: `light`, `dark` and `hc` (high contrast). A theme is one attribute on `<html>`: `data-theme="dark"`. It also works on any element, so a preview can render a theme inside a single card.

| Token | Use it for | Do not use it for |
| --- | --- | --- |
| `color-bg` | The page canvas | Cards. Use `surface` |
| `color-surface` | Cards, inputs, chips, the stage | The page background |
| `color-surface-2` | Quiet fills: hover, wells, empty states | Anything that needs to stand out |
| `color-border` | Dividers and resting outlines | Input borders. Use `border-strong` (3:1 for non-text, WCAG 1.4.11) |
| `color-border-strong` | Input, button and control outlines | Decorative lines |
| `color-text` | All body and heading text | — |
| `color-text-muted` | Secondary text and metadata | Anything a visitor must read to finish a task |
| `color-action` | Primary buttons, links, the selected state | Decoration or headings. If it isn't interactive, it isn't action-coloured |
| `color-on-action` | Text and icons on `color-action` | Text on any other background |
| `color-focus` | The focus ring, only | Anything else. The focus ring must never be mistaken for a selected state |
| `color-highlight` | Short emphasis: a marker, a new item, a pulse | Text colour. It fails contrast on `surface` |
| `color-danger`, `color-ok`, `color-warn` | Status, always paired with an icon or a word | Brand colour, or meaning without a label |
| `color-stamp` | Passport stamps and completion marks | General success states. Use `ok` |

### The brand override

A visitor can pick a brand colour (stop 01). `lib/color.ts → brandScale()` derives two values from it:

- `--brand-light`: the nearest colour with at least 4.5:1 contrast on white.
- `--brand-dark`: re-tuned for dark surfaces (lightness of at least 72%), then checked against `ink-950`.

The semantic tokens read `var(--brand-light, <default>)`, so the system stays accessible whatever is picked. **Dark mode is not inverted light mode.** Every dark value is chosen for its own surface.

High contrast ignores the brand. It uses `pop-sun` for action and `pop-sky` for focus, because in that theme the contrast guarantee matters more than brand.

## Space and density

| Token | Comfortable | Compact | Typical use |
| --- | --- | --- | --- |
| `space-1` | 4px | 2px | Icon to label |
| `space-2` | 8px | 6px | Inside a control |
| `space-3` | 12px | 8px | Between related controls |
| `space-4` | 16px | 12px | Inside a card |
| `space-5` | 24px | 16px | Between groups |
| `space-6` | 32px | 24px | Between sections |
| `space-7` | 48px | 32px | Page rhythm |
| `control-h` | 44px | 36px | The minimum height of anything clickable |

Density changes spacing and control height. **It never changes type size.** Compact mode is for scanning, not for squeezing in more words.

Choose space by relationship, not by eye. Things that belong together sit closer than things that don't (proximity). If two gaps look the same but mean different things, one of them is wrong.

## Type

| Token | Size | Use |
| --- | --- | --- |
| `size-1` | 0.75rem | Metadata, chips, badges. Never paragraphs |
| `size-2` | 0.875rem | Labels, helper text, secondary copy |
| `size-3` | 1rem | Body. The default |
| `size-4` | 1.125rem | Lede and card titles |
| `size-5` | 1.5rem | Section headings |
| `size-6` | 2rem | Page headings |
| `size-display` | clamp(3rem → 4rem) | One per page, for the hero only |

Families: `family-display` (Bricolage Grotesque) for headings and the wordmark, `family-body` (Inter) for everything else, and `family-mono` (JetBrains Mono) for code, keys, tokens and numbers that line up.

Use rem for type, so it follows the visitor's browser setting. Body line-height is 1.5, and headings are tighter (1.05 to 1.2).

## Radius

`radius-s` (6px) for chips, keys and small marks. `radius-m` (12px) for inputs and panels. `radius-l` (20px) for cards and the stage. `radius-pill` for buttons and filters.

Nested radius: the inner radius equals the outer radius minus the padding. A `radius-l` card with `space-2` padding holds children at `radius-m`, not at `radius-l`.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `duration-fast` | 140ms | Hover, press, small state changes |
| `duration-base` | 260ms | Theme changes, panels opening |
| `duration-slow` | 520ms | Celebration only: stamps and the finale burst |
| `ease-out` | cubic-bezier(.2,.8,.2,1) | Nearly everything. It starts fast and settles |
| `ease-press` | cubic-bezier(.3,1.6,.5,1) | Overshoot for tactile moments (the stamp) |

Motion explains a change. It shows where something came from or went to. If an animation doesn't explain anything, remove it. `prefers-reduced-motion` reduces every transition to almost nothing, so meaning never depends on motion.

## Adding or changing a token

1. **Check whether an existing token already means this.** Most requests for a new token are an existing decision with a new value.
2. Name it for its purpose (`color-selected`), not its look (`color-light-blue`).
3. Add it to every theme in `semantic`. A token that exists in light mode only is a bug in dark mode.
4. Check contrast: 4.5:1 for text, 3:1 for large text and non-text UI, in all three themes.
5. Run `npm run tokens`, then `npm run lint:css`.
6. Add a row to the table in this file.

## Don'ts

- Don't use `color-mix()` or `opacity` to make a new colour that appears in more than one place. Make it a token.
- Don't use `color-highlight` or any `pop-*` colour as text.
- Don't override tokens inside one component to "fix" a theme. Fix the semantic value.
- Don't add a size between two existing sizes. If the scale doesn't fit, the layout is the problem.
