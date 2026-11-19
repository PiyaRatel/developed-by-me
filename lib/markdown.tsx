// A small Markdown → React renderer for the design-skills docs.
// It covers what those files use: headings, paragraphs, lists, checklists, tables,
// code fences, quotes, rules, and inline code, bold, italic and links.
// It builds React elements and never uses raw HTML, so the docs can't inject markup.
import type { ReactNode } from "react";

export type DocLinkResolver = (href: string) => string;

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;

function inline(text: string, resolve: DocLinkResolver, key = ""): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const k = `${key}${i}`;
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={k}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{inline(part.slice(2, -2), resolve, k)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const href = resolve(link[2]!);
      const external = /^https?:/.test(href);
      return (
        <a key={k} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {inline(link[1]!, resolve, k)}
          {external && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      );
    }
    if (/^\*[^*].*\*$/.test(part)) return <em key={k}>{inline(part.slice(1, -1), resolve, k)}</em>;
    return part;
  });
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/**
 * Renders a Markdown string. Heading levels shift by `shift` (the default 1 makes `#` an h2),
 * and heading ids are prefixed with `idPrefix` so several docs can share a page.
 */
export function Markdown({ source, idPrefix, resolve = (h) => h, shift = 1 }: { source: string; idPrefix: string; resolve?: DocLinkResolver; shift?: number }) {
  const lines = source.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let para: string[] = [];

  const flush = () => {
    if (para.length) out.push(<p key={`p${out.length}`}>{inline(para.join(" "), resolve, `p${out.length}-`)}</p>);
    para = [];
  };

  while (i < lines.length) {
    const line = lines[i]!;
    const t = line.trim();

    if (t.startsWith("```")) {
      flush();
      const lang = t.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) body.push(lines[i++]!);
      i++;
      out.push(
        <pre key={`c${out.length}`} className="md-code" data-lang={lang || undefined}>
          <code>{body.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      const level = Math.min(6, h[1]!.length + shift);
      const Tag = `h${level}` as "h2";
      const text = h[2]!;
      out.push(
        <Tag key={`h${out.length}`} id={`${idPrefix}-${slug(text)}`} className={`md-h${level}`}>
          {inline(text, resolve)}
        </Tag>,
      );
      i++;
      continue;
    }

    if (/^---+$/.test(t)) {
      flush();
      out.push(<hr key={`r${out.length}`} className="md-rule" />);
      i++;
      continue;
    }

    if (t.startsWith("|")) {
      flush();
      const rows: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) rows.push(lines[i++]!);
      const [head, , ...body] = rows;
      out.push(
        <div key={`t${out.length}`} className="md-table-wrap" tabIndex={0} role="region" aria-label="Table">
          <table className="md-table">
            <thead>
              <tr>
                {cells(head ?? "").map((c, j) => (
                  <th key={j} scope="col">
                    {inline(c, resolve)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {cells(r).map((c, j) => (
                    <td key={j}>{inline(c, resolve)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const ul = /^[-*]\s+/;
    const ol = /^\d+\.\s+/;
    if (ul.test(t) || ol.test(t)) {
      flush();
      const ordered = ol.test(t);
      const re = ordered ? ol : ul;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i]!.trim())) items.push(lines[i++]!.trim().replace(re, ""));
      const checklist = items.every((x) => /^\[[ x]\]\s/.test(x));
      const List = ordered ? "ol" : "ul";
      out.push(
        <List key={`l${out.length}`} className={checklist ? "md-list md-check" : "md-list"}>
          {items.map((x, j) => (
            <li key={j}>{inline(checklist ? x.replace(/^\[[ x]\]\s/, "") : x, resolve)}</li>
          ))}
        </List>,
      );
      continue;
    }

    if (t.startsWith(">")) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) q.push(lines[i++]!.trim().replace(/^>\s?/, ""));
      out.push(
        <blockquote key={`q${out.length}`} className="md-quote">
          {inline(q.join(" "), resolve)}
        </blockquote>,
      );
      continue;
    }

    if (!t) flush();
    else para.push(t);
    i++;
  }
  flush();
  return <>{out}</>;
}
