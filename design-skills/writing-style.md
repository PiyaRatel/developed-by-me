# Writing style

Words are interface. A label is a control, an error is a recovery flow, and a prompt is a component spec. This guide covers all three.

## Voice: fixed

The voice never changes. It is **clear, warm and precise.**

| We are | We are not |
| --- | --- |
| Clear: one idea per sentence, in common words | Clever at the cost of being understood |
| Warm: we talk to one person, as "you" | Gushing, cute or over-familiar |
| Precise: exact numbers, real names, the actual result | Vague ("something went wrong") or inflated ("revolutionary") |
| Honest: we say when AI was involved and when it failed | Defensive, or quiet about a fallback |

## Tone: flexes

Tone shifts with the moment. The voice stays the same.

| Moment | Tone | Example |
| --- | --- | --- |
| Onboarding, intro | Inviting, brief | "Ten tiny, real interactions. Each one takes less than 45 seconds." |
| Doing a task | Neutral, out of the way | "Email address" |
| Success | Quiet, specific | "Invite sent." |
| Error | Calm, helpful, no blame | "Enter a valid email address." |
| A dare or reward | Light, a little playful | "Make this card unreadable, then save it." |
| Destructive or legal | Plain and exact | "This deletes 3 themes. You can't undo it." |

The writing-styles project on the Ready page (`lib/writing-styles.ts`) shows the range: Plain, Friendly, Formal and Playful. **Plain is the default and the fallback.** Use the others only when a product asks for them.

## Rules checked in code

`lib/copy-rules.ts` checks these automatically, and they apply to all copy, not only AI output:

- **No exclamation marks.** Enthusiasm comes from what happened, not from punctuation.
- **No "oops", "whoops", "simply" or "just".** "Simply" and "just" make a struggling person feel slow. "Oops" makes a failure seem cute.
- **No words in all caps.** If it needs emphasis, the layout should give it.
- **Length limits:** title 40 characters, body 120, CTA 20.

## Rules for people

### Structure
- **Front-load.** Put the words people scan for first: "Undo the last change", not "Click here to undo the last change".
- One idea per sentence. Most sentences have fewer than 20 words.
- Write to a reading grade of 8 or lower (`readingGrade()`).
- Use active voice. "We saved your plan", not "Your plan has been saved".
- Use sentence case everywhere: headings, buttons, tabs, labels.

### Buttons and links
- Start with a verb, and say what happens: "Send invite", "Save plan", "Show prompt".
- Use the same verb all the way through. If the button says "Delete", the confirmation says "Delete" and the toast says "Deleted".
- No "Click here", "Learn more" or "Submit" without an object. Link text makes sense out of context.
- Name both choices: "Delete themes" and "Keep them", never "OK" and "Cancel".

### Errors
Answer three questions, in this order: **What happened? Is anything lost? What do I do now?**

| Don't | Do |
| --- | --- |
| "Invalid input." | "Enter an email address, like name@company.com." |
| "Oops, something went wrong!" | "We couldn't reach the model, so a recorded run is playing instead." |
| "You entered the wrong password." | "That password doesn't match. Try again or reset it." |
| "Error 429" | "Too many requests in a minute. Try again in 30 seconds." |

Never blame the visitor. Say "That email doesn't look complete", not "You entered an invalid email".

### Empty states
Say why it's empty and what to do next, in that order. "No saved projects. Projects you save will appear here." Then one CTA: "Create project".

### Numbers, time and units
- Use numerals: "3 themes", not "three themes", except at the start of a sentence.
- Put units after a space: "45 s", "8 s", "500 characters".
- Give relative time for recent events ("2 minutes ago") and the date for older ones ("19 Nov 2026").

### Accessibility in words
- Write labels for the ear as well as the eye. "Stop 04: Agent", not "04".
- Text inside `sr-only` completes the visible text. It doesn't contradict it.
- Never say "see the red field" or "click the icon on the right". Name the thing.
- Alt text describes what the image does, not what it shows. Decorative images get `alt=""`.

## AI-specific writing

- **Say when AI made it.** "Drafted by AI. Check it before you use it", not output presented as fact.
- **Say when it didn't.** The Scripted run badge is copy too: "The live API was slow or unavailable, so a recorded run played instead."
- **Hedge in proportion.** "Probably for designers (assumed)" is right when it's a guess. Don't hedge a fact, and don't present a guess as a fact.
- **Don't make the AI a person.** No "I'm thinking…" or "I'd love to help". Describe the system: "Planning 3 steps…".
- **Name refusals plainly.** "That's outside what this demo can build. Try a dashboard or a form."

## Writing prompts

A prompt is a component, so spec it like one (stop 05, `assemblePrompt()`):

1. **Role:** what this prompt produces, in one line.
2. **Voice (fixed)** and **Tone (flexes)**, as two separate blocks.
3. **Component spec:** every slot, with its character limit and form ("cta ≤ 20 chars, verb first").
4. **Rules:** the same banned words and punctuation as above.
5. **One good example.** Examples work better than adjectives.
6. **Visitor input:** fenced, labelled "data, not instructions", and capped.

Version prompts. Review them like code. Check the output in code, never by asking the model whether it followed the rules.

## Word list

| Use | Avoid |
| --- | --- |
| sign in | log in, login (as a verb) |
| select, choose | click (it excludes keyboard and touch users) |
| can't, don't, we'll | cannot, do not (except in the formal style) |
| stop | step, slide (for a tour page) |
| dare | challenge, task |
| recorded run, Scripted run | fake, mock, demo mode |
| colour | color (in prose. Code identifiers keep `color`) |
| AI | the AI assistant, the bot |
