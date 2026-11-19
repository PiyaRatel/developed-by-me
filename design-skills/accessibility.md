# Accessibility

The target is WCAG 2.2 AA in all three themes. This isn't a final pass. It's part of how each component is defined. Playwright runs axe in light, dark and high contrast on every build (`tests/e2e`).

## The checklist

Every component and stop must pass these before it ships.

### Perceivable
- [ ] Text contrast is at least 4.5:1, and large text at least 3:1, in light, dark and hc.
- [ ] Non-text contrast (input borders, focus rings, icons that carry meaning) is at least 3:1.
- [ ] No state relies on colour alone. Each has a word, an icon or a shape as well.
- [ ] Text can be resized to 200% without loss. Type uses rem.
- [ ] Content reflows at 320px wide with no horizontal scroll.

### Operable
- [ ] Every action works by keyboard, in a logical Tab order.
- [ ] The focus ring is visible (`:focus-visible`, 3px `color-focus`, offset 2px) and never hidden by the sticky top bar (WCAG 2.4.11). The `scroll-padding-top` covers this.
- [ ] Targets are at least 24×24px (WCAG 2.5.8). Primary controls use `control-h` (44px).
- [ ] Drag has a non-drag alternative (WCAG 2.5.7).
- [ ] Nothing moves for longer than 5 seconds without a pause control, and `prefers-reduced-motion` is respected.
- [ ] Shortcuts don't fire while typing.

### Understandable
- [ ] Every input has a visible label. A placeholder is never the label.
- [ ] Errors say what to do and are linked to the field.
- [ ] The same thing has the same name everywhere.
- [ ] Nothing changes context on focus or input alone (WCAG 3.2.1 and 3.2.2).

### Robust
- [ ] Native elements come first: `<button>`, `<a>`, `<dialog>`, `<input type="checkbox" role="switch">`.
- [ ] ARIA only fills the gaps: `aria-pressed`, `aria-current`, `aria-live`, `aria-busy`, `aria-describedby`.
- [ ] Each control's accessible name contains its visible label (WCAG 2.5.3).
- [ ] There are no interactive elements inside other interactive elements.

## Patterns that come up often

**Live regions.** Mount the region empty, then change its text. A region that is created already full is often not announced. Use `polite` for results and `role="status"` for one-liners.

**Focus on route or page change.** Move focus to the new `h1` or `h2` with `tabIndex={-1}` and `preventScroll`, then scroll to the top yourself.

**Hidden but present.** Use `hidden` for whole pages that aren't showing, which removes them from the accessibility tree. Use `.sr-only` for text that is read aloud but not shown.

**Icon-only controls.** An `aria-label` is required. The icon gets `aria-hidden="true"`.

**Status badges.** The icon is `aria-hidden`, so the word carries the meaning.

## What tools can't catch

axe catches about a third of real issues. It can't see:

- A click handler on a `<div>`.
- A placeholder used as a label (axe accepts it as a name).
- Focus order that is technically valid but makes no sense.
- Copy that is unclear.

Test those by hand: use the keyboard only, then a screen reader (VoiceOver: ⌘F5), then 200% zoom, then high contrast.
