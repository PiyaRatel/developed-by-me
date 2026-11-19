// One config drives the state matrix, the playground, Storybook stories and visual tests.
export type MatrixCell = {
  id: string;
  label: string;
  props: { variant?: "primary" | "secondary" | "destructive"; size?: "sm" | "md"; loading?: boolean; disabled?: boolean; iconOnly?: boolean; label?: string };
  force?: "hover" | "focus" | "active";
  dir?: "rtl";
  theme?: "hc";
  tone?: "error" | "success";
};

export const MATRIX: MatrixCell[] = [
  { id: "default", label: "Default", props: {} },
  { id: "hover", label: "Hover", props: {}, force: "hover" },
  { id: "focus", label: "Focus-visible", props: {}, force: "focus" },
  { id: "active", label: "Pressed", props: {}, force: "active" },
  { id: "disabled", label: "Disabled", props: { disabled: true } },
  { id: "loading", label: "Loading", props: { loading: true } },
  { id: "error", label: "Error", props: { variant: "destructive", label: "Retry" }, tone: "error" },
  { id: "success", label: "Success", props: { label: "Saved ✓" }, tone: "success" },
  { id: "secondary", label: "Secondary", props: { variant: "secondary" } },
  { id: "destructive", label: "Destructive", props: { variant: "destructive", label: "Delete" } },
  { id: "icon", label: "Icon only", props: { iconOnly: true } },
  { id: "long", label: "Long label", props: { label: "Save and continue to billing" } },
  { id: "rtl", label: "RTL", props: { label: "حفظ" }, dir: "rtl" },
  { id: "hc", label: "High contrast", props: {}, theme: "hc" },
];

/** The state the matrix "forgot". Clicking its blank cell reveals it. */
export const FORGOTTEN = "loading";

export const FIGMA_TO_PROPS = [
  ["Type = Primary | Secondary | Destructive", "variant"],
  ["Size = S | M", "size"],
  ["State = Loading", "loading"],
  ["Show label = false", "iconOnly + aria-label"],
] as const;
