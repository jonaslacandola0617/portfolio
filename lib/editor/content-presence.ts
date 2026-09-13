type TipTapNode = {
  type?: unknown;
  text?: unknown;
  content?: unknown;
};

const standaloneContentNodes = new Set(["horizontalRule", "commandBlock", "mermaid", "mediaImage", "mediaAttachment"]);

function nodeHasMeaningfulContent(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const node = value as TipTapNode;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;

  if (typeof node.type === "string" && standaloneContentNodes.has(node.type)) return true;

  return Array.isArray(node.content) && node.content.some(nodeHasMeaningfulContent);
}

export function hasMeaningfulTipTapContent(content: unknown): boolean {
  return nodeHasMeaningfulContent(content);
}
