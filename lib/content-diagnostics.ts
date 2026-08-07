import type { z } from "zod";

export interface ContentRecordContext {
  model: "Project" | "Lab" | "Article" | "Certificate";
  id?: string;
  slug?: string;
  title?: string;
}

export interface ContentDiagnostic {
  path: string;
  nodeType: string;
  reason: string;
}

const blockTypes = new Set([
  "heading",
  "paragraph",
  "blockquote",
  "horizontalRule",
  "bulletList",
  "orderedList",
  "codeBlock",
  "callout",
  "commandBlock",
  "mermaid",
  "table",
  "taskList",
]);

const inlineTypes = new Set(["text", "hardBreak"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function typeOfNode(value: unknown): string {
  return isRecord(value) && typeof value.type === "string" ? value.type : typeof value;
}

function arrayContent(
  node: Record<string, unknown>,
  path: string,
  nodeType: string
): ContentDiagnostic | unknown[] {
  if (!Array.isArray(node.content)) {
    return { path: `${path}.content`, nodeType, reason: "expected an array of child nodes" };
  }
  return node.content;
}

function inspectInline(node: unknown, path: string, parentType: string): ContentDiagnostic | undefined {
  if (!isRecord(node)) {
    return { path, nodeType: parentType, reason: "expected an inline node object" };
  }
  if (!inlineTypes.has(String(node.type))) {
    return {
      path,
      nodeType: parentType,
      reason: `expected inline content; found ${typeOfNode(node)}`,
    };
  }
  if (node.type === "text" && typeof node.text !== "string") {
    return { path: `${path}.text`, nodeType: "text", reason: "expected text to be a string" };
  }
  if (node.marks !== undefined && !Array.isArray(node.marks)) {
    return { path: `${path}.marks`, nodeType: "text", reason: "expected marks to be an array" };
  }
  return undefined;
}

function inspectBlock(node: unknown, path: string, parentType = "doc"): ContentDiagnostic | undefined {
  if (!isRecord(node)) {
    return { path, nodeType: parentType, reason: "expected a block node object" };
  }

  const nodeType = typeOfNode(node);
  if (!blockTypes.has(nodeType)) {
    return {
      path,
      nodeType: parentType,
      reason: inlineTypes.has(nodeType)
        ? `expected block content; found inline node "${nodeType}"`
        : `unsupported block node "${nodeType}"`,
    };
  }

  if (nodeType === "horizontalRule" || nodeType === "commandBlock" || nodeType === "mermaid") {
    return undefined;
  }

  const content = arrayContent(node, path, nodeType);
  if (!Array.isArray(content)) return content;

  if (nodeType === "heading" || nodeType === "paragraph") {
    for (let index = 0; index < content.length; index++) {
      const issue = inspectInline(content[index], `${path}.content.${index}`, nodeType);
      if (issue) return issue;
    }
    return undefined;
  }

  if (nodeType === "codeBlock") {
    for (let index = 0; index < content.length; index++) {
      const child = content[index];
      if (!isRecord(child) || child.type !== "text" || typeof child.text !== "string") {
        return {
          path: `${path}.content.${index}`,
          nodeType,
          reason: `expected plain text content; found ${typeOfNode(child)}`,
        };
      }
    }
    return undefined;
  }

  if (nodeType === "bulletList" || nodeType === "orderedList") {
    for (let index = 0; index < content.length; index++) {
      const item = content[index];
      const itemPath = `${path}.content.${index}`;
      if (!isRecord(item) || item.type !== "listItem") {
        return { path: itemPath, nodeType, reason: `expected listItem; found ${typeOfNode(item)}` };
      }
      const itemContent = arrayContent(item, itemPath, "listItem");
      if (!Array.isArray(itemContent)) return itemContent;
      for (let childIndex = 0; childIndex < itemContent.length; childIndex++) {
        const issue = inspectBlock(itemContent[childIndex], `${itemPath}.content.${childIndex}`, "listItem");
        if (issue) return issue;
      }
    }
    return undefined;
  }

  if (nodeType === "taskList") {
    for (let index = 0; index < content.length; index++) {
      const item = content[index];
      const itemPath = `${path}.content.${index}`;
      if (!isRecord(item) || item.type !== "taskItem") {
        return { path: itemPath, nodeType, reason: `expected taskItem; found ${typeOfNode(item)}` };
      }
      const itemContent = arrayContent(item, itemPath, "taskItem");
      if (!Array.isArray(itemContent)) return itemContent;
      for (let childIndex = 0; childIndex < itemContent.length; childIndex++) {
        const issue = inspectBlock(itemContent[childIndex], `${itemPath}.content.${childIndex}`, "taskItem");
        if (issue) return issue;
      }
    }
    return undefined;
  }

  if (nodeType === "table") {
    for (let rowIndex = 0; rowIndex < content.length; rowIndex++) {
      const row = content[rowIndex];
      const rowPath = `${path}.content.${rowIndex}`;
      if (!isRecord(row) || row.type !== "tableRow") {
        return { path: rowPath, nodeType, reason: `expected tableRow; found ${typeOfNode(row)}` };
      }
      const cells = arrayContent(row, rowPath, "tableRow");
      if (!Array.isArray(cells)) return cells;
      for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
        const cell = cells[cellIndex];
        const cellPath = `${rowPath}.content.${cellIndex}`;
        if (!isRecord(cell) || (cell.type !== "tableCell" && cell.type !== "tableHeader")) {
          return { path: cellPath, nodeType: "tableRow", reason: `expected tableCell or tableHeader; found ${typeOfNode(cell)}` };
        }
        const cellContent = arrayContent(cell, cellPath, String(cell.type));
        if (!Array.isArray(cellContent)) return cellContent;
        for (let childIndex = 0; childIndex < cellContent.length; childIndex++) {
          const issue = inspectBlock(
            cellContent[childIndex],
            `${cellPath}.content.${childIndex}`,
            String(cell.type)
          );
          if (issue) return issue;
        }
      }
    }
    return undefined;
  }

  for (let index = 0; index < content.length; index++) {
    const issue = inspectBlock(content[index], `${path}.content.${index}`, nodeType);
    if (issue) return issue;
  }
  return undefined;
}

export function diagnoseTipTapDocument(
  value: unknown,
  zodError?: z.ZodError
): ContentDiagnostic {
  if (!isRecord(value)) {
    return { path: "content", nodeType: typeof value, reason: "expected a TipTap document object" };
  }
  if (value.type !== "doc") {
    return { path: "content.type", nodeType: typeOfNode(value), reason: 'expected root type "doc"' };
  }
  if (!Array.isArray(value.content)) {
    return { path: "content.content", nodeType: "doc", reason: "expected an array of block nodes" };
  }
  for (let index = 0; index < value.content.length; index++) {
    const issue = inspectBlock(value.content[index], `content.${index}`);
    if (issue) return issue;
  }

  const firstIssue = zodError?.issues[0];
  return {
    path: firstIssue?.path.length ? `content.${firstIssue.path.join(".")}` : "content",
    nodeType: typeOfNode(value),
    reason: firstIssue?.message ?? "does not match the strict TipTap content contract",
  };
}

export function formatContentDiagnostic(
  context: ContentRecordContext,
  diagnostic: ContentDiagnostic
): string {
  return [
    `[content] Invalid ${context.model}`,
    context.id ? `id=${context.id}` : undefined,
    context.slug ? `slug=${context.slug}` : undefined,
    context.title ? `title=${JSON.stringify(context.title.slice(0, 120))}` : undefined,
    `path=${diagnostic.path}`,
    `node=${diagnostic.nodeType}`,
    `reason=${diagnostic.reason}`,
  ]
    .filter(Boolean)
    .join(" | ");
}
