import type { TipTapBlockNode, TipTapDoc, TipTapInlineNode } from "@/types/tiptap";
import { validateTipTapDoc } from "@/lib/validations/content";

const WORDS_PER_MINUTE = 200;

function extractInlineText(nodes: TipTapInlineNode[] | undefined): string {
  return (nodes ?? []).map((n) => (n.type === "text" ? n.text : "")).join(" ");
}

function extractText(node: TipTapBlockNode): string {
  switch (node.type) {
    case "heading":
    case "paragraph":
      return extractInlineText(node.content);
    case "blockquote":
      return node.content.map(extractText).join(" ");
    case "bulletList":
    case "orderedList":
      return node.content.map((li) => li.content.map(extractText).join(" ")).join(" ");
    case "codeBlock":
      return (node.content ?? []).map((n) => n.text).join(" ");
    case "callout":
      return node.content.map(extractText).join(" ");
    case "commandBlock":
      return node.attrs.commands.join(" ");
    case "table":
      return node.content
        .map((row) => row.content.map((cell) => cell.content.map(extractText).join(" ")).join(" "))
        .join(" ");
    case "taskList":
      return node.content.map((item) => item.content.map(extractText).join(" ")).join(" ");
    case "mermaid":
    case "horizontalRule":
      return "";
    default:
      return "";
  }
}

/**
 * Replaces the `reading-time` npm package, which works on markdown
 * strings — TipTap JSON needs its text extracted first. Matches the
 * original package's output format ("3 min read") so
 * ContentItem.readingTime keeps the same shape everywhere it's used.
 */
export function estimateReadingTime(value: unknown): string {
  const result = validateTipTapDoc(value);
  if (!result.success) return "1 min read";
  const doc = result.data as TipTapDoc;
  const text = doc.content.map(extractText).join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
