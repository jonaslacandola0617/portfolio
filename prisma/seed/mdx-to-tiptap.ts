import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import type {
  TipTapBlockNode,
  TipTapDoc,
  TipTapMark,
  TipTapTableCellNode,
  TipTapTextNode,
} from "@/types/tiptap";

/**
 * Converts one MDX file's body into a TipTap JSON document.
 *
 * This is deliberately a direct mdast → TipTap-JSON mapper, not the
 * MDX → HTML → generateJSON(html, extensions) bridge originally sketched
 * in docs/CMS_MIGRATION_PLAN.md §5. Reason for the change: the 4 files
 * being migrated use a small, fully-known set of constructs (headings,
 * paragraphs, lists, code fences, <Callout>, <CommandBlock>) — a direct
 * mapper covers all of it without pulling in @tiptap/html or needing a
 * real TipTap extension schema to exist yet (Phase 4 still doesn't have
 * one). If a future migration phase needs to convert genuinely
 * unpredictable, editor-authored MDX, the HTML-bridge approach is worth
 * revisiting — for this bounded, known input, it would have been more
 * machinery for the same result.
 *
 * Trust note: this runs once, locally, over files already in this repo —
 * not over untrusted input. The one place that matters concretely is
 * evaluating MDX JSX expression attributes (e.g. CommandBlock's
 * `commands={[...]}`) with `Function(...)` below, which would be
 * inappropriate for anything other than developer-authored source files.
 */

interface MdastNode {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  lang?: string;
  url?: string;
  name?: string;
  attributes?: Array<{
    type: string;
    name: string;
    value?: string | { type: string; value: string };
  }>;
  children?: MdastNode[];
}

function getJsxAttr(node: MdastNode, name: string): string | undefined {
  const attr = node.attributes?.find((a) => a.name === name);
  if (!attr || attr.value === undefined) return undefined;
  return typeof attr.value === "string" ? attr.value : undefined;
}

function getJsxExpressionAttr(node: MdastNode, name: string): unknown {
  const attr = node.attributes?.find((a) => a.name === name);
  if (!attr || typeof attr.value !== "object") return undefined;
  const source = attr.value.value;
  // Safe in this context only because it runs once, locally, over this
  // repo's own trusted MDX files — see module doc comment.
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`"use strict"; return (${source});`)();
  } catch {
    return undefined;
  }
}

/** Only ever produces `text` nodes — this MDX→TipTap converter has no
 *  mdast "break" case, so the narrower internal type here is accurate,
 *  not just convenient. The public return type is still the wider
 *  `TipTapInlineNode[]` (which now also includes `hardBreak`, added
 *  during the editor-contract audit) since that's what every caller of
 *  this function actually expects to consume. */
function convertMarks(node: MdastNode): TipTapTextNode[] {
  if (node.type === "text") {
    return [{ type: "text", text: node.value ?? "" }];
  }
  if (node.type === "inlineCode") {
    return [{ type: "text", text: node.value ?? "", marks: [{ type: "code" }] }];
  }
  if (node.type === "strong" || node.type === "emphasis" || node.type === "link") {
    const mark: TipTapMark =
      node.type === "strong"
        ? { type: "bold" }
        : node.type === "emphasis"
          ? { type: "italic" }
          : { type: "link", attrs: { href: node.url ?? "" } };
    const inner = (node.children ?? []).flatMap(convertMarks);
    return inner.map((child) => ({
      ...child,
      marks: [...(child.marks ?? []), mark],
    }));
  }
  // Unknown inline node — skip rather than crash the whole migration.
  return (node.children ?? []).flatMap(convertMarks);
}

function convertCalloutChildren(children: MdastNode[]): TipTapBlockNode[] {
  return children
    .filter((c) => !(c.type === "text" && !c.value?.trim()))
    .flatMap(convertBlock);
}

function convertBlock(node: MdastNode): TipTapBlockNode[] {
  switch (node.type) {
    case "heading":
      return [
        {
          type: "heading",
          attrs: { level: (node.depth ?? 2) as 1 | 2 | 3 | 4 | 5 | 6 },
          content: (node.children ?? []).flatMap(convertMarks),
        },
      ];

    case "paragraph":
      return [
        {
          type: "paragraph",
          content: (node.children ?? []).flatMap(convertMarks),
        },
      ];

    case "list": {
      const isTaskList = (node.children ?? []).some(
        (li) => (li as MdastNode & { checked?: boolean | null }).checked != null
      );
      if (isTaskList) {
        return [
          {
            type: "taskList",
            content: (node.children ?? []).map((li) => ({
              type: "taskItem" as const,
              attrs: { checked: Boolean((li as MdastNode & { checked?: boolean | null }).checked) },
              content: (li.children ?? []).flatMap(convertBlock),
            })),
          },
        ];
      }
      const items = (node.children ?? []).map((li) => ({
        type: "listItem" as const,
        content: (li.children ?? []).flatMap(convertBlock),
      }));
      return [
        node.ordered
          ? { type: "orderedList", content: items }
          : { type: "bulletList", content: items },
      ];
    }

    case "code": {
      if (node.lang === "mermaid") {
        return [{ type: "mermaid", attrs: { chart: (node.value ?? "").trim() } }];
      }
      return [
        {
          type: "codeBlock",
          attrs: { language: node.lang ?? "text" },
          content: node.value ? [{ type: "text", text: node.value }] : [],
        },
      ];
    }

    case "table": {
      // Real TipTap table cells hold block content (content: "block+"),
      // not inline text directly — wrapping in a paragraph here matches
      // what the toolbar's "Table" button and any real edit actually
      // produce. See types/tiptap.ts's TipTapTableCellNode comment and
      // docs/PRE_PHASE_6_STABILIZATION_REPORT.md for the full contract
      // audit this was found during.
      const rows = node.children ?? [];
      return [
        {
          type: "table",
          content: rows.map((row, rowIndex) => ({
            type: "tableRow" as const,
            content: (row.children ?? []).map(
              (cell): TipTapTableCellNode => ({
                type: rowIndex === 0 ? "tableHeader" : "tableCell",
                content: [
                  {
                    type: "paragraph",
                    content: (cell.children ?? []).flatMap(convertMarks),
                  },
                ],
              })
            ),
          })),
        },
      ];
    }

    case "mdxJsxFlowElement": {
      if (node.name === "Callout") {
        const variant = (getJsxAttr(node, "type") ?? "info") as
          | "info"
          | "tip"
          | "warning"
          | "success"
          | "danger";
        const title = getJsxAttr(node, "title");
        return [
          {
            type: "callout",
            attrs: { variant, ...(title ? { title } : {}) },
            content: convertCalloutChildren(node.children ?? []),
          },
        ];
      }
      if (node.name === "CommandBlock") {
        const title = getJsxAttr(node, "title") ?? "terminal";
        const commandsAttr = getJsxExpressionAttr(node, "commands");
        const commands = Array.isArray(commandsAttr) ? commandsAttr.map(String) : [];
        return [{ type: "commandBlock", attrs: { title, commands } }];
      }
      if (node.name === "Mermaid") {
        const chartAttr = getJsxExpressionAttr(node, "chart");
        const chart = typeof chartAttr === "string" ? chartAttr.trim() : "";
        return [{ type: "mermaid", attrs: { chart } }];
      }
      // Unknown custom component — skip with a console warning rather
      // than silently dropping content or crashing the whole file.
      console.warn(`  ! Unrecognized MDX component <${node.name}> — skipped.`);
      return [];
    }

    case "thematicBreak":
    case "blockquote":
      // Not used by any of the 4 files being migrated this phase.
      // Falling through to paragraph-of-children would be the extension
      // point if that changes.
      return [];

    default:
      return [];
  }
}

export function mdxBodyToTipTapDoc(mdxSource: string): TipTapDoc {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(mdxSource) as unknown as MdastNode;
  const content = (tree.children ?? []).flatMap(convertBlock);
  return { type: "doc", content };
}
