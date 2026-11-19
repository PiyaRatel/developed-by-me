"use client";

import { useState } from "react";
import { FIGMA_TO_PROPS, FORGOTTEN, MATRIX, type MatrixCell } from "@/lib/button-matrix";
import { Button, type ButtonProps } from "../ds/Button";
import { Marker, useStop } from "../Stop";

type Pg = { variant: "primary" | "secondary" | "destructive"; size: "sm" | "md"; state: "idle" | "disabled" | "loading"; iconOnly: boolean; label: string; rtl: boolean };

const Plus = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function toProps(p: Pg): ButtonProps {
  const base = { variant: p.variant, size: p.size, icon: <Plus /> };
  const content = p.iconOnly ? ({ iconOnly: true, "aria-label": p.label } as const) : ({ children: p.label } as const);
  const state = p.state === "loading" ? ({ loading: true } as const) : ({ disabled: p.state === "disabled" } as const);
  return { ...base, ...content, ...state } as ButtonProps;
}

function jsx(p: Pg): string {
  const attrs = [
    p.variant !== "primary" && `variant="${p.variant}"`,
    p.size !== "md" && `size="${p.size}"`,
    p.state === "loading" && "loading",
    p.state === "disabled" && "disabled",
    p.iconOnly && "iconOnly",
    p.iconOnly && `aria-label="${p.label}"`,
    "icon={<Plus />}",
  ].filter(Boolean);
  const open = `<Button ${attrs.join(" ")}`;
  const btn = p.iconOnly ? `${open} />` : `${open}>\n  ${p.label}\n</Button>`;
  return p.rtl ? `<div dir="rtl">\n${btn.replace(/^/gm, "  ")}\n</div>` : btn;
}

function fromCell(c: MatrixCell): Pg {
  return {
    variant: c.props.variant ?? "primary",
    size: c.props.size ?? "md",
    state: c.props.loading ? "loading" : c.props.disabled ? "disabled" : "idle",
    iconOnly: !!c.props.iconOnly,
    label: c.props.label ?? (c.props.iconOnly ? "Add item" : "Save"),
    rtl: c.dir === "rtl",
  };
}

export default function Stop08States() {
  const { complete } = useStop();
  const [revealed, setRevealed] = useState(false);
  const [pg, setPg] = useState<Pg | null>(null);
  const [copied, setCopied] = useState(false);

  const open = (c: MatrixCell) => {
    if (c.id === FORGOTTEN && !revealed) {
      setRevealed(true);
      complete();
    }
    setPg(fromCell(c));
    setCopied(false);
  };

  return (
    <div className="s08">
      <ul className="matrix" aria-label="Button state matrix. Choose a cell to open it in the playground.">
        {MATRIX.map((c) => {
          const blank = c.id === FORGOTTEN && !revealed;
          const p = fromCell(c);
          return (
            <li key={c.id} className="cell" data-blank={blank || undefined} data-tone={c.tone}>
              <div className="cell-preview" dir={c.dir} data-theme={c.theme} data-force={c.force} aria-hidden="true" inert>
                {!blank && <Button {...toProps(p)} tabIndex={-1} />}
              </div>
              <button type="button" className="cell-label" onClick={() => open(c)}>
                {blank ? "?" : c.label}
                <span className="sr-only">{blank ? " Empty cell: reveal the missing state" : ": open in playground"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="s08-pg">
        {pg ? (
          <>
            <div className="pg-preview" dir={pg.rtl ? "rtl" : undefined}>
              <Button {...toProps(pg)} />
            </div>
            <div className="pg-controls">
              <label className="field-inline">
                Variant
                <select value={pg.variant} onChange={(e) => setPg({ ...pg, variant: e.target.value as Pg["variant"] })}>
                  <option value="primary">primary</option>
                  <option value="secondary">secondary</option>
                  <option value="destructive">destructive</option>
                </select>
              </label>
              <label className="field-inline">
                Size
                <select value={pg.size} onChange={(e) => setPg({ ...pg, size: e.target.value as Pg["size"] })}>
                  <option value="sm">sm</option>
                  <option value="md">md</option>
                </select>
              </label>
              <Marker n={2}>
                <label className="field-inline">
                  State
                  <select value={pg.state} onChange={(e) => setPg({ ...pg, state: e.target.value as Pg["state"] })}>
                    <option value="idle">idle</option>
                    <option value="disabled">disabled</option>
                    <option value="loading">loading</option>
                  </select>
                </label>
                <p className="muted pg-rule">loading and disabled can't both be on, so it's one State control.</p>
              </Marker>
              <label className="switch">
                <input type="checkbox" checked={pg.iconOnly} onChange={(e) => setPg({ ...pg, iconOnly: e.target.checked, label: e.target.checked ? "Add item" : "Save" })} />
                Icon only (needs a label)
              </label>
              <label className="switch">
                <input type="checkbox" checked={pg.rtl} onChange={(e) => setPg({ ...pg, rtl: e.target.checked })} />
                RTL
              </label>
            </div>
            <Marker n={3} className="pg-code">
              <pre aria-label="Generated JSX">
                <code>{jsx(pg)}</code>
              </pre>
              <button
                type="button"
                className="btn btn-small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(jsx(pg));
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "Copied" : "Copy code"}
              </button>
            </Marker>
          </>
        ) : (
          <p className="muted">One of these cells is blank. Choose any cell to open it here.</p>
        )}
        <Marker n={1}>
          <table className="figma-props">
            <caption className="sr-only">Figma property to code prop</caption>
            <thead>
              <tr>
                <th scope="col">Figma property</th>
                <th scope="col">Prop</th>
              </tr>
            </thead>
            <tbody>
              {FIGMA_TO_PROPS.map(([f, p]) => (
                <tr key={f}>
                  <td>{f}</td>
                  <td>
                    <code>{p}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Marker>
      </div>
    </div>
  );
}
