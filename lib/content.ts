// All page copy lives here so it can be edited in one place.
// Claims are drafts in the portfolio owner's voice. Edit freely.

export type Category = "Design system" | "AI interaction" | "AI product";

export type StopMeta = {
  n: number;
  category: Category;
  seconds: number;
  title: string;
  claim: string;
  deeper: [string, string, string];
  dare: string;
  notes: string[]; // design notes under the stage; empty hides the row
  tech: string[];
  stamp: string;
  source: string; // path in the repo
  sourceNote?: { label: string; href: string };
};

export const SITE = {
  name: "Developed by Me",
  owner: "Product design engineer",
  // Replace with the real repository and case-study URLs before publishing.
  repo: "https://github.com/your-handle/developed-by-me",
  caseStudy: "/case-study",
};

export const STOPS: StopMeta[] = [
  {
    n: 1,
    category: "Design system",
    seconds: 30,
    title: "Change one decision. Restyle everything.",
    claim: "I design tokens as decisions, so a brand change is one edit and not a hundred.",
    deeper: [
      "Three tiers: primitive (ink-900) → semantic (color-action) → component (button-bg).",
      "Figma modes map one-to-one to data-theme values, so design and code switch the same way.",
      "Dark mode is not inverted light mode. Brand colours are re-tuned for each surface.",
    ],
    dare: "Make this card unreadable, then save it.",
    notes: [],
    tech: ["DTCG JSON", "Token build script", "CSS variables", "WCAG contrast"],
    stamp: "Token Tamer",
    source: "components/stops/Stop01Tokens.tsx",
    sourceNote: { label: "Figma Variables REST API", href: "https://www.figma.com/developers/api#variables" },
  },
  {
    n: 2,
    category: "Design system",
    seconds: 35,
    title: "Systems are for teams, not screens.",
    claim: "A design system is a contribution process with a UI. I design the process too.",
    deeper: [
      "Contribution criteria are written down, so review is about the criteria and not taste.",
      "Semantic versioning and deprecation windows let teams upgrade when it suits them.",
      "Health metrics: adoption, detach rate, docs coverage. Measured, not vibes.",
    ],
    dare: "Get your component approved.",
    notes: [
      "Status track: Draft → Review → Approved.",
      "Severity describes the impact on users, not how strict the rule is.",
      "The health score moves when the component ships.",
    ],
    tech: ["Typed state machine", "Deterministic checks", "Claude (explains only)"],
    stamp: "Gatekeeper",
    source: "components/stops/Stop02Governance.tsx",
  },
  {
    n: 3,
    category: "Design system",
    seconds: 40,
    title: "Accessible is the default, not the final check.",
    claim: "I check accessibility while I build, so it never becomes a list of fixes at the end.",
    deeper: [
      "A placeholder is not a label. It disappears the moment you type.",
      "Never rely on colour alone to show a state.",
      "WCAG 2.2 adds target size (24 px) and focus not obscured.",
    ],
    dare: "Fill in this form without a mouse.",
    notes: [
      "Focus-order overlay: the numbers show where Tab goes next.",
      "The name a screen reader announces for each control.",
      "Each fix cites its WCAG criterion.",
    ],
    tech: ["axe-core", "React", "WCAG 2.2 AA"],
    stamp: "Keyboard Hero",
    source: "components/stops/Stop03Accessibility.tsx",
  },
  {
    n: 4,
    category: "AI interaction",
    seconds: 45,
    title: "Agents should show their work and wait for you.",
    claim: "I design agents as visible step machines that you can pause, steer and sign off.",
    deeper: [
      "Approval gates: nothing is saved until you say yes.",
      "Clarifying questions are UI controls, not a chat back-and-forth.",
      "Edit one card instead of regenerating the whole plan.",
    ],
    dare: "Interrupt the agent mid-plan.",
    notes: ["A step rail that shows honest progress.", "Pause and redirect without starting over.", "Edit or regenerate one card at a time."],
    tech: ["Next.js route", "Zod", "Claude tool use", "AbortController"],
    stamp: "Agent Wrangler",
    source: "components/stops/Stop04Agent.tsx",
  },
  {
    n: 5,
    category: "AI product",
    seconds: 35,
    title: "Good AI copy is designed, not lucky.",
    claim: "I treat prompts like components: specced, constrained, versioned and tested.",
    deeper: [
      "The voice stays the same. The tone flexes with the moment.",
      "Constraints and examples work better than clever wording.",
      "Prompts are versioned design assets, reviewed like code.",
    ],
    dare: "Make the AI break a brand rule.",
    notes: ["Show prompt: the full prompt, assembled from parts.", "A character limit for every slot.", "A reading-level score for every option."],
    tech: ["Prompt assembly", "Zod limits", "Rule checks in code"],
    stamp: "Word Smith",
    source: "components/stops/Stop05Copy.tsx",
  },
  {
    n: 6,
    category: "AI interaction",
    seconds: 35,
    title: "Show what the AI guessed. Let people fix it.",
    claim: "I make AI assumptions visible and editable, so trust is earned and not assumed.",
    deeper: [
      "Calibrated trust: people should rely on the AI exactly as much as it deserves.",
      "Confirm assumptions with a yes or no, not a new prompt.",
      "AI edits can be undone like any other edit.",
    ],
    dare: "Catch the AI guessing.",
    notes: [
      "Each assumption is labelled understood, unsure or assumed.",
      "Confidence is shown as a word and an icon, never colour alone.",
      "A history strip of every change, with undo.",
    ],
    tech: ["Dependency graph", "Rule-based confidence", "Command history"],
    stamp: "Trust Builder",
    source: "components/stops/Stop06Trust.tsx",
  },
  {
    n: 7,
    category: "AI product",
    seconds: 40,
    title: "AI can sort the notes. You decide what's true.",
    claim: "I use AI to speed up synthesis, and I design the checks that keep it honest.",
    deeper: [
      "A theme is a pattern across people, not one loud quote.",
      "Observation → insight → opportunity. Each step is a claim you can check.",
      "AI risks: invented quotes and lost minority views.",
    ],
    dare: "Find the theme the AI got wrong.",
    notes: ["Every theme links to the quotes it cites.", "A keyboard “Move to…” menu as the drag-and-drop alternative.", "A quality scorecard."],
    tech: ["Zod theme schema", "dnd-kit", "Markdown export"],
    stamp: "Pattern Spotter",
    source: "components/stops/Stop07Research.tsx",
  },
  {
    n: 8,
    category: "Design system",
    seconds: 30,
    title: "A component is every state, not the happy one.",
    claim: "I ship components as state matrices, so nothing surprises the team in production.",
    deeper: [
      "Figma component properties map directly to code props.",
      ":focus-visible shows a ring for keyboard users and not for mouse clicks.",
      "RTL works because the styles use logical properties (inline-start, not left).",
    ],
    dare: "Find a state I forgot.",
    notes: ["Figma property → code prop table.", "Impossible combinations are blocked.", "Copy the code."],
    tech: ["TypeScript unions", "cva variants", "Config-driven matrix"],
    stamp: "State Collector",
    source: "components/stops/Stop08States.tsx",
  },
  {
    n: 9,
    category: "AI product",
    seconds: 40,
    title: "Give AI your system, and it stops making things up.",
    claim: "I connect AI to the design system through MCP, so it builds only with real parts.",
    deeper: [
      "MCP in plain words: a standard plug that lets AI tools use your data and functions.",
      "Usage rules written for machines, not just for humans.",
      "Nothing is saved without approval.",
    ],
    dare: "Ask for a screen my system can't make.",
    notes: ["A live tool-call log.", "Inspect mode labels each component and token.", "Approve or reject the result."],
    tech: ["MCP SDK", "Zod UI tree", "Component registry"],
    stamp: "System Whisperer",
    source: "components/stops/Stop09MCP.tsx",
  },
  {
    n: 10,
    category: "AI interaction",
    seconds: 40,
    title: "The interface changes with the goal, but never loses its system.",
    claim: "I design generative UI as a fixed set of modules that AI arranges and never redraws.",
    deeper: [
      "The generative-UI spectrum: fill in the content → pick the modules → compose the layout.",
      "AI decides what to show. The system decides how it looks.",
      "Always say why the layout changed.",
    ],
    dare: "Shape-shift the dashboard.",
    notes: ["A “why this layout” line.", "A fixed module set on a fixed grid.", "The data stays the same when the view changes."],
    tech: ["Module registry", "Container queries", "Serialisable state"],
    stamp: "Shape Shifter",
    source: "components/stops/Stop10GenUI.tsx",
  },
];

export const FILTERS: Category[] = ["Design system", "AI interaction", "AI product"];

export const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Short presentation cut: the only stops shown on the home page, with the tag each one wears.
 * Add entries here to bring more experiments back.
 */
export const FEATURED: { n: number; tag: string }[] = [
  { n: 1, tag: "Design system" },
  { n: 5, tag: "Writing style" },
];
