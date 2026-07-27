import type { TipTapBlockNode, TipTapDoc, TipTapInlineNode } from "@/types/tiptap";

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
export function estimateReadingTime(doc: TipTapDoc): string {
  const text = doc.content.map(extractText).join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
