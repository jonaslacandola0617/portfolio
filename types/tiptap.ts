/**
 * The JSON schema this project's content uses — a deliberate subset of
 * what TipTap/ProseMirror documents can express, scoped to what the 4
 * migrated projects actually contain plus reasonable general rich text.
 *
 * Phase 4 (the real editor) will produce documents conforming to this
 * exact shape via actual `@tiptap/core` Node extensions; nothing here
 * depends on the `@tiptap/*` packages themselves, which aren't installed
 * yet — this is a plain data contract, not a runtime dependency. When
 * Phase 4 lands, the extensions are built to match this schema, not the
 * other way around.
 */

export type TipTapMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "code" }
  | { type: "link"; attrs: { href: string } };

export interface TipTapTextNode {
  type: "text";
  text: string;
  marks?: TipTapMark[];
}

export interface TipTapHeadingNode {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: TipTapInlineNode[];
}

export interface TipTapParagraphNode {
  type: "paragraph";
  content?: TipTapInlineNode[];
}

export interface TipTapListItemNode {
  type: "listItem";
  content: TipTapBlockNode[];
}

export interface TipTapBulletListNode {
  type: "bulletList";
  content: TipTapListItemNode[];
}

export interface TipTapOrderedListNode {
  type: "orderedList";
  content: TipTapListItemNode[];
}

/** Plain code block, parameterized by language — one node type covers
 *  Cisco CLI / Linux / PowerShell / JSON / YAML / Python / plain text. */
export interface TipTapCodeBlockNode {
  type: "codeBlock";
  attrs: { language: string };
  content?: TipTapTextNode[];
}

/** Info/warning/success/danger/tip — one node type, variant attribute.
 *  Renders via components/shared/callout.tsx, unchanged since the MDX era. */
export interface TipTapCalloutNode {
  type: "callout";
  attrs: { variant: "info" | "tip" | "warning" | "success" | "danger"; title?: string };
  content: TipTapBlockNode[];
}

/** Leaf node (no children) — renders via components/shared/command-block.tsx. */
export interface TipTapCommandBlockNode {
  type: "commandBlock";
  attrs: { title: string; commands: string[] };
}

export interface TipTapTableCellNode {
  type: "tableCell" | "tableHeader";
  content: TipTapInlineNode[];
}

export interface TipTapTableRowNode {
  type: "tableRow";
  content: TipTapTableCellNode[];
}

export interface TipTapTableNode {
  type: "table";
  content: TipTapTableRowNode[];
}

export interface TipTapTaskItemNode {
  type: "taskItem";
  attrs: { checked: boolean };
  content: TipTapBlockNode[];
}

export interface TipTapTaskListNode {
  type: "taskList";
  content: TipTapTaskItemNode[];
}

/** Leaf node (no children) — renders via components/shared/mermaid-diagram.tsx. */
export interface TipTapMermaidNode {
  type: "mermaid";
  attrs: { chart: string };
}

export type TipTapInlineNode = TipTapTextNode;

export type TipTapBlockNode =
  | TipTapHeadingNode
  | TipTapParagraphNode
  | TipTapBulletListNode
  | TipTapOrderedListNode
  | TipTapCodeBlockNode
  | TipTapCalloutNode
  | TipTapCommandBlockNode
  | TipTapMermaidNode
  | TipTapTableNode
  | TipTapTaskListNode;

export interface TipTapDoc {
  type: "doc";
  content: TipTapBlockNode[];
}
