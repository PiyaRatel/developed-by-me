import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// cva variants map to classes that read only from tokens (see globals.css .ds-btn).
export const buttonVariants = cva("ds-btn", {
  variants: {
    variant: { primary: "ds-btn--primary", secondary: "ds-btn--secondary", destructive: "ds-btn--destructive" },
    size: { sm: "ds-btn--sm", md: "ds-btn--md" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled"> & {
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md";
  icon?: ReactNode;
};
// Discriminated unions make impossible states unrepresentable:
// an icon-only button must have a label, and a loading button can't also be disabled.
type Content = { iconOnly: true; "aria-label": string; children?: never } | { iconOnly?: false; children: ReactNode };
type State = { loading: true; disabled?: never } | { loading?: false; disabled?: boolean };
export type ButtonProps = Base & Content & State;

export function Button(props: ButtonProps) {
  const { variant, size, icon, iconOnly, loading, className, ...rest } = props;
  const { children, disabled, ...attrs } = rest as typeof rest & { children?: ReactNode; disabled?: boolean };
  return (
    <button
      type="button"
      {...attrs}
      className={buttonVariants({ variant, size, className: [iconOnly ? "ds-btn--icon" : "", className].filter(Boolean).join(" ") })}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
    >
      {loading ? <span className="ds-spinner" aria-hidden="true" /> : icon}
      {!iconOnly && <span>{loading ? "Saving…" : children}</span>}
    </button>
  );
}
