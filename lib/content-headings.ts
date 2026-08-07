import { validateTipTapDoc } from "@/lib/validations/content";
import type {
  TipTapBlockNode,
  TipTapInlineNode,
  TipTapDoc,
} from "@/types/tiptap";

export interface ContentHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function getHeadingText(content: TipTapInlineNode[] | undefined) {
  return (content ?? [])
    .map((node) => (node.type === "text" ? node.text : " "))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function headingSlug(text: string) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

export function nextHeadingAnchor(text: string, counts: Map<string, number>) {
  const base = headingSlug(text);
  const occurrence = (counts.get(base) ?? 0) + 1;
  counts.set(base, occurrence);
  return occurrence === 1 ? base : `${base}-${occurrence}`;
}

function walkBlocks(
  nodes: TipTapBlockNode[],
  counts: Map<string, number>,
  headings: ContentHeading[],
) {
  for (const node of nodes) {
    if (node.type === "heading") {
      const text = getHeadingText(node.content);
      const id = nextHeadingAnchor(text, counts);
      if ((node.attrs.level === 2 || node.attrs.level === 3) && text) {
        headings.push({ id, text, level: node.attrs.level });
      }
      continue;
    }

    if (node.type === "blockquote" || node.type === "callout") {
      walkBlocks(node.content, counts, headings);
      continue;
    }

    if (node.type === "bulletList" || node.type === "orderedList") {
      for (const item of node.content) walkBlocks(item.content, counts, headings);
      continue;
    }

    if (node.type === "taskList") {
      for (const item of node.content) walkBlocks(item.content, counts, headings);
      continue;
    }

    if (node.type === "table") {
      for (const row of node.content) {
        for (const cell of row.content) walkBlocks(cell.content, counts, headings);
      }
    }
  }
}

export function extractContentHeadings(content: unknown): ContentHeading[] {
  const result = validateTipTapDoc(content);
  if (!result.success) return [];

  const headings: ContentHeading[] = [];
  walkBlocks((result.data as TipTapDoc).content, new Map(), headings);
  return headings;
}
