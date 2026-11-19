# Components

Each entry says what the component is for, when to use it, when **not** to use it, and what it must never do. If two components could do the job, the "When not" lines decide.

Build only with these parts. If none of them fits, write down the gap and raise it. Don't fork a component in a stop file.

---

## Button

`components/ds/Button.tsx` (typed, cva variants) and `.btn` in `globals.css` (page chrome).

**Use it for** an action that changes something: submit, save, run, approve, undo.

**When not**
- To go somewhere. That's a link (`<a>` or `next/link`). A button that navigates breaks middle-click, copy link and "open in new tab".
- To switch between options. That's a segmented control or a filter (`aria-pressed`).
- For a bare icon without a name. `iconOnly` requires `aria-label`, and the type system enforces it.

**Variants**

| Variant | Use | Limit |
| --- | --- | --- |
| `primary` | The one action the view exists for | One per view |
| `secondary` | Alternatives, such as Cancel, Back or Skip | Any number, but group them |
| `destructive` | Actions that delete or discard | Pair with undo where you can. Confirm only when undo is not possible |
| `.btn-ghost` | Low-weight actions inside dense UI | Never the only action in a view |
| `.btn-small` | Inline actions in cards and toolbars | Still at least a 24px target (WCAG 2.5.8) |

**States:** default, hover, focus-visible, pressed, disabled, loading, plus RTL and high contrast. All of them are in the state matrix at stop 08 (`lib/button-matrix.ts`). A button that doesn't have all of them isn't finished.

**Rules**
- Labels start with a verb and say what will happen: "Send invite", not "OK". Use 20 characters or fewer.
- `loading` and `disabled` cannot both be true, and the types make that impossible. Loading keeps focus and announces `aria-busy`.
- Don't disable a submit button to hide validation. Let the visitor press it and tell them what's missing.

```tsx
<Button variant="primary">Save plan</Button>
<Button iconOnly aria-label="Close" icon={<X />} />
<Button loading>Save plan</Button>
```

## Link and link-button

**Use a link** to go somewhere: another page, another stop, a source file.
**Use `.link-btn`** for a low-emphasis *action* that should look like text, such as "Show prompt" or "Reset".

**When not:** Don't style a link as a primary button for an action that happens on the page. Don't open a new tab unless the visitor would lose work, and when you do, say so ("opens in a new tab").

## Filter and segmented control

`.filter` (rail filters), `.seg` / `.seg-opt` (option groups inside a stage).

**Use** a filter to narrow what is shown. Use a segment to choose one mode from two to five, such as theme, tone or density.

**When not**
- More than five options. Use a `<select>`.
- Choices that each start an action. Use buttons.
- Settings that need a Save step. A segment applies at once.

**Rules:** Filters toggle with `aria-pressed`. A segment is a `<fieldset className="seg">` with a `<legend>` and native radios inside `.seg-opt` labels, so arrow keys work without extra code. The selected state is never shown by colour alone. It fills or inverts.

## Switch

`.switch`: an on/off setting that takes effect immediately, such as "Show focus order" or "Inspect mode".

**When not:** For something that only takes effect when a form is submitted. Use a checkbox. For an action like "Turn off now", use a button.

Use a native `<input type="checkbox" role="switch">`. The label describes the *on* state ("Show focus order"), never the toggle itself ("Toggle focus order").

## Field

`.field`: a label, the control, and helper or error text.

**Rules**
- There is always a visible `<label>`. **A placeholder is not a label.** It disappears as soon as you type, and it fails contrast.
- Helper text sits below the control and is linked with `aria-describedby`.
- Errors replace the helper text, start with what to do ("Enter a valid email address"), use `color-danger` **and** an icon, and are announced.
- Validate when the visitor leaves the field or submits, never on every key press.

## Badge

`.badge`, the registry `Badge`: a short status label, 16 characters or fewer, with an icon.

**Use** for status: Scripted run, In review, Approved, Unsure.
**When not**
- For counts that change all the time. Use plain text in a live region.
- For actions. A badge isn't clickable. If it needs to be, it's a chip or a button.
- For decoration or categories nobody acts on.

**Tone:** `neutral` for paused, cancelled or informational states, because nothing is broken. `ok` for done. `warn` only when the visitor needs to act. Using `warn` for a paused state teaches people to ignore warnings.

## Chip

`.chip` / `.rail-chip`: a compact, selectable or navigable item in a row, such as a stop in the rail or a goal option.

**When not:** For status. That's a badge. For a single primary action, use a button. When a chip is the current page, mark it with `aria-current`, not only with a style.

## Card

`.plan-card`, `.demo-card`, `.module`: a surface that groups one object with its actions.

**Rules**
- One object per card. If a card has two headings of the same level, it's two cards.
- Card background is `card-bg`, and the radius is `card-radius`.
- Don't make the whole card clickable when it contains other controls. Nested interactive elements are invalid, and they trap keyboard users.
- Actions sit at the bottom or the top right, always in the same place across the set.

## EmptyState

`.empty-state`, the registry `EmptyState`: explains why a view is empty and offers one next step.

**Anatomy:** an icon, a title (40 characters or fewer), a body (120 or fewer) and **exactly one** primary button (20 or fewer).

**When not**
- While loading. That's a loading state, and showing "Nothing here" before the data arrives is a lie.
- After an error. That's an error state with a retry.
- When the empty view has nothing to do next. Use a one-line `Text` instead.

Copy is checked by `lib/copy-rules.ts`. See [writing-style.md](writing-style.md).

## Dialog and sheet

`<dialog>` with `showModal()` (`.sheet`).

**Use** for a short, focused task that blocks the page, such as keyboard shortcuts or confirming an action that cannot be undone.

**When not**
- To show information the visitor might want alongside the page. Use an inline panel.
- For a multi-step flow. Use a page or the stage.
- For a confirmation an undo could replace.

**Rules:** The dialog has a heading linked with `aria-labelledby`. Esc closes it. Focus moves into the dialog and back to the trigger when it closes. Native `<dialog>` handles most of this, so don't rebuild it.

## Step rail

`.step-rail` (stop 04) and `.sync-steps` (stop 01): a visible list of steps for agents and pipelines.

**Use** when the system works in steps the visitor might want to pause, steer or check.
**Rules:** Each step is shown as waiting, running, done, paused or failed, with a word and an icon. Progress is honest. Never show a fake percentage. The current step is announced through a polite live region.

## Confidence and assumption

`.conf`, `.assumption` (stop 06): show how sure the AI is and what it assumed.

**Levels:** *Understood*, *Unsure* and *Assumed*. Each has a word, an icon and a colour, in that order of importance.
**Rules:** Every assumption can be confirmed or corrected with a yes or no (`.confirm`), not with a new prompt. Don't show a numeric confidence score. People read "82%" as more precise than it is.

## Scripted run badge

`.badge-scripted`: shown whenever the recorded run plays instead of a live model call.

**This one is non-negotiable.** If the output didn't come from the model, the visitor is told. The badge explains why in its title: the API is missing, slow, rate-limited or failed its schema.

## Kbd

`<kbd>`: a keyboard key. Use it in shortcut hints and inside buttons with a shortcut ("Undo ⌘/Ctrl Z"). Always offer the clickable alternative. A shortcut is never the only way to do something.

## Layout: Stack, stage and stop

- **Stack** (`.ui-stack`, the registry `Stack`) is vertical rhythm with `space-3`, `space-4` or `space-5` only.
- **Stage** (`.stage`) is the live interaction area of a stop. It holds one interaction, one dare and nothing else.
- **Stop** (`components/Stop.tsx`) is the shared frame: a numbered heading, the claim, Go deeper, the stage, notes and the source. Every stop uses it, and none of them builds its own frame.

---

## Adding a component

1. Show that two or more places need it. One use is a pattern, not a component.
2. Write its "Use it for" and "When not" lines *before* writing code. If you can't, it isn't a component yet.
3. Use tokens only. Use logical properties (`inline-start`, not `left`) so RTL works.
4. Build the full state matrix: default, hover, focus-visible, pressed, disabled, loading, error, RTL and high contrast.
5. Make impossible states impossible in the types.
6. If AI may compose it, add it to `lib/registry.json` with prop limits and usage rules.
7. Add it to this file.
