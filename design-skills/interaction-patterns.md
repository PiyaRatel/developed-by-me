# Interaction patterns

Patterns are the agreements a visitor learns once and then relies on everywhere. Breaking one in a single place costs more than whatever it gains there.

## 1. Navigation and wayfinding

- **Every page has a URL.** Stops are `#stop-01` to `#stop-10`, then `#finale` and `#ready`. Back and forward work, and deep links work.
- **When the page changes, focus moves to the new heading** (`tabIndex={-1}`) and the window scrolls to the top. Screen-reader users hear where they are.
- **Mark the current place in two ways.** The rail chip gets `aria-current="step"` and a visible underline.
- **Separate destinations are links.** The design system is its own route (`/design-system`) with a clear way back to the tour.

## 2. Keyboard

| Key | Does |
| --- | --- |
| `1` – `9`, `0` | Jump to stops 01 – 10 |
| `←` `→` | Previous and next page |
| `?` | Open or close the shortcuts sheet |
| `⌘/Ctrl Z` | Undo, where undo exists |
| `Esc` | Close the dialog or cancel |

**Rules**
- Global shortcuts never fire while someone is typing in a text field, select or contenteditable.
- Controls that own arrow keys, such as sliders, radios and selects, keep them.
- Single-character shortcuts collide with screen readers and voice control (WCAG 2.1.4). Don't add new ones. The existing `1`–`0` and `?` keys are a known gap: to meet 2.1.4 they need an off switch in the shortcuts sheet, or a modifier.
- Every shortcut has a visible, clickable equivalent.

## 3. Feedback

**Every action gets a response within 100ms,** even if it's only a pressed state.

| Wait | Show |
| --- | --- |
| Under 300ms | Nothing extra. A spinner would only flicker |
| 300ms – 2s | The control's loading state (`aria-busy`) |
| 2s – 8s | Honest steps (a step rail) or streaming output |
| Over 8s | Fall back. The recorded run plays and the Scripted run badge shows |

- Results are announced with `aria-live="polite"`. Use `role="status"` for one-line messages. Use `assertive` only for errors that block the task.
- Success is quiet: a word, a tick, a stamp. Celebration (the burst, the stamp press) is kept for finishing a dare.

## 4. The four states of every view

Design all four before calling a view done:

1. **Loading.** The layout keeps its shape. Show which step is running, not a spinner over a blank page.
2. **Empty.** Explain why, and offer one next step (see EmptyState).
3. **Error.** Say what happened, whether anything was lost, and what to do. Keep what the visitor entered.
4. **Ready.** The content.

Add a fifth for AI: **Partial.** Some output arrived and some didn't. Show what is there, mark what is missing, and let the visitor retry only the missing part.

## 5. Undo over confirm

- Reversible actions happen at once and offer undo (stops 06 and 10, `⌘/Ctrl Z`).
- Confirm only what cannot be undone, and name it: "Delete 3 themes? This can't be undone." The buttons are "Delete themes" and "Keep them", never "Yes" and "No".
- A history strip shows what changed, so undo is something you can see, not something you have to trust.

## 6. Forms

- Labels are visible, above or beside the control.
- Validate when the visitor leaves the field or submits. Never punish typing.
- On submit with errors, move focus to the first invalid field. If there are several errors, show a summary.
- Keep input after an error, a refresh (saved in the store) or a fallback.
- Character limits show a count only near the limit, and the count is announced.

## 7. Drag and drop

Drag is never the only way to move something. Every draggable item has a keyboard **"Move to…"** menu (stop 07). The drag handle is a visible target of at least 24px with a name ("Move quote 3").

---

# AI interaction patterns

AI output is a suggestion until a person accepts it. These patterns put that into practice.

## A1. Visible steps, not a black box

Show an agent as a step machine: plan, then ask, then act, then review. Each step is visible, and the visitor can **pause**, **redirect** or **stop** it (stop 04). "Thinking…" with nothing else is not a state.

## A2. Ask with controls, not chat

When the AI needs a decision, offer it as UI: chips, a yes or no, a choice of two. Don't make the visitor type an answer a button could give. Ask at most three clarifying questions before acting.

## A3. Approval gates

Nothing is saved, sent or published without an explicit approve action. The approve button names the thing being approved: "Add 3 components to the page", not "Approve".

## A4. Show assumptions and confidence

- Label each inference *Understood*, *Unsure* or *Assumed*, with a word and an icon.
- Let the visitor confirm or correct each one in place, with one click.
- Don't show a percentage. Calibrate trust: people should rely on the AI exactly as much as it deserves.

## A5. Edit one part, not everything

Regenerate or edit a single card, step or paragraph. Never force the visitor to regenerate everything to fix one line. Work they have already accepted stays fixed.

## A6. Cite the source

A synthesised claim links to what it came from. In research (stop 07), every theme links to its quotes. A claim without a source is marked as one.

## A7. Constrain the output, then check it in code

- The model returns structured data validated with Zod (`lib/ai-schemas.ts`). If the shape is wrong, the output is treated as a failure, not rendered.
- Rules are checked in code (`lib/copy-rules.ts`). **The model never grades itself.**
- Generative UI composes only registered parts (`lib/registry.json`), served over MCP. If the model asks for a part that doesn't exist, the request is rejected and the rejection is shown.

## A8. Fail honestly and gracefully

| Failure | Response |
| --- | --- |
| No API key, timeout (over 8s), rate limit | Play the recorded run and show the Scripted run badge |
| The output fails its schema | Recorded run and badge. The failure is logged, not shown as content |
| A refusal | Recorded run, plus a plain message if the visitor asked for something out of scope |
| Spend cap reached | Recorded run for everyone, with no error shown |

The visitor's experience never breaks because the model did.

## A9. Visitor input is data

Anything typed goes into the prompt inside a clearly fenced block (`<visitor_input>`), labelled as data, with a 500-character cap. Instructions in it are never followed.

## A10. Stream with structure

When output streams, reserve its final layout first, so content fills in without jumping. Don't animate text one letter at a time to look clever. Show it as it arrives.

---

## Anti-patterns

- A spinner with no end and no explanation.
- "Are you sure?" on an action that could have had undo.
- AI output that saves itself.
- A chat box where a control would do.
- Colour-only status (a red border with no message).
- A confidence percentage.
- A disabled button with no reason given.
- Hover-only information. Touch and keyboard users never see it.
- Scroll-jacking, or motion that can't be turned off.
