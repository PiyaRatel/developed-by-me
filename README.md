# Developed by Me

One page of a product design engineer's portfolio: a 10-stop tour of AI interaction and design-system work. Each stop is a tiny, real interaction you can finish in under 45 seconds. Finish a stop's dare to stamp the skill passport. Ten stamps unlock **Your Plan It**, a shareable card built from your own choices.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 (builds tokens first)
```

The page works fully without an API key. Every AI stop has a recorded run that plays when the API is missing, slow (over 8 s), rate-limited or returns something that fails its schema. A small **Scripted run** badge shows when that happens.

To use live Claude calls, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`.

| Command | What it does |
| --- | --- |
| `npm run tokens` | DTCG JSON (`tokens/tokens.json`) → `app/tokens.css` |
| `npm run typecheck` | Strict TypeScript |
| `npm run lint:css` | Stylelint: blocks raw colours, gaps, radii and fonts outside tokens |
| `npm test` | Vitest unit tests (21) |
| `npm run test:e2e` | Playwright: full tour, keyboard, fit-to-screen, axe in 3 themes, mobile (8). Run `npm run build` first. `SHOTS=1` saves screenshots to `screenshots/`. Install the browser once with `npx playwright install chromium`. |
| `npm run mcp` | Starts the design-system MCP server on stdio |

Add the MCP server to Claude Code: `claude mcp add design-system -- node mcp-server/index.mjs`

## Where things live

| Path | What |
| --- | --- |
| `lib/content.ts` | **All stop copy**: titles, claims, Go deeper, dares, notes, stamps. Edit here. Also `SITE.repo` and `SITE.caseStudy`, which you need to fill in. |
| `components/Stop.tsx` | The shared stop layout, numbered markers, lazy-loaded stage |
| `components/Tour.tsx` | Sticky nav, passport, rail, filters, keys 1–0 / ← → / ?, URL hash |
| `components/Finale.tsx` | Your Plan It card, share link, shape burst |
| `components/stops/Stop01…10*.tsx` | One file per stage |
| `lib/store.tsx` | Theme, brand, stamps, plan and saved copy; carried across stops and saved in localStorage |
| `app/api/ai/route.ts` | The only place the model is called. Zod in and out, 500-character cap, IP rate limit, monthly spend cap |
| `design-skills/` | **The design system as skill files**: `SKILL.md` (entry point for people and agents), `tokens.md`, `components.md` (when to use, when not), `interaction-patterns.md` (including AI patterns), `writing-style.md`, `accessibility.md` |
| `app/design-system/page.tsx` | The `/design-system` page. It renders `design-skills/*.md` as they are, plus live token swatches from `tokens/tokens.json`. Linked from **Design System ↗** in the top rail |
| `lib/mcp-tools.mjs`, `mcp-server/` | `search_components`, `get_tokens`, `get_usage_rules`, `check_contrast`, shared by the server and stop 09 |

## Honest notes and deviations from the brief

- **Token build:** a small, dependency-free script (`scripts/build-tokens.mjs`) instead of Style Dictionary. Same DTCG input and tiered CSS output.
- **Figma sync clip:** not included. Stop 01 has a simulated Figma → GitHub → deploy sequence. Add the real 15-second clip when you have it.
- **Spend cap and rate limit:** in memory. That's fine for one instance; for serverless, move them to a KV store.
- **Refusals:** a model refusal falls back to the scripted run. Server-side model fallbacks are not configured.
- **Stop 03:** axe-core finds 3 of the 5 issues. The other 2 are custom checks, and the UI says so. axe accepts a placeholder as a name, and it can't see a click handler on a `div`.
- **Stops 06 and 07:** the "AI" output is the recorded run (rule-based confidence and a fixed clustering). Only stops 04, 05 and 09 call the model when a key is set.
- **Not done yet:** Radix/React Aria primitives (native elements are used instead), a Lighthouse measurement, a CI workflow, and ESLint (CSS token linting is in place).
- **Fit-to-screen:** verified at 1440×900 and 1280×800 for every stop, in its expanded state too.
