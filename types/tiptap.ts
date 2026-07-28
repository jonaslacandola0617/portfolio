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

/**
 * Node/mark coverage — kept in sync with what the configured editor can
 * actually produce (lib/editor/extensions.ts + lib/editor/extensions/*)
 * and with the toolbar (components/editor/toolbar.tsx). See the
 * pre-Phase-6 stabilization report for the audit that established this
 * list: every node/mark below has a toolbar button or is a normal
 * StarterKit default with no way to disable it from user input (`text`,
 * `paragraph`, `hardBreak` via Shift+Enter). `strike` and `underline`
 * are NOT modeled here on purpose — StarterKit v3 bundles both by
 * default with keyboard shortcuts (Cmd+Shift+S, Cmd+U) even though
 * neither has a toolbar button, so they're explicitly disabled in
 * `getEditorExtensions()` instead of being given a schema — the editor
 * genuinely cannot produce them, so there's nothing for the schema to
 * cover.
 */

export type TipTapMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "code" }
  | {
      type: "link";
      attrs: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
        title?: string | null;
      };
    };

export interface TipTapTextNode {
  type: "text";
  text: string;
  marks?: TipTapMark[];
}

/** Leaf inline node produced by Shift+Enter — no toolbar button, but a
 *  standard StarterKit default with no way to disable it from the
 *  keyboard, so it has to be modeled rather than rejected. */
export interface TipTapHardBreakNode {
  type: "hardBreak";
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

/** Toolbar "Quote" button (StarterKit's Blockquote, content: "block+" —
 *  holds block nodes, typically paragraphs, not inline text directly). */
export interface TipTapBlockquoteNode {
  type: "blockquote";
  content: TipTapBlockNode[];
}

/** Toolbar "Horizontal rule" button — atomic leaf, no attrs, no content. */
export interface TipTapHorizontalRuleNode {
  type: "horizontalRule";
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
  attrs?: {
    start: number;
    type: "1" | "a" | "A" | "i" | "I" | null;
  };
  content: TipTapListItemNode[];
}

/** Plain code block, parameterized by language — one node type covers
 *  Cisco CLI / Linux / PowerShell / JSON / YAML / Python / plain text.
 *  `language` is nullable: @tiptap/extension-code-block's own attribute
 *  default is `this.options.defaultLanguage`, which this project leaves
 *  unset (see lib/editor/extensions.ts) — so `toggleCodeBlock()` from
 *  the toolbar produces `attrs: { language: null }`, not a string. This
 *  was the confirmed root cause of the reported autosave failure: every
 *  code block created via the toolbar failed `safeParse()` before this
 *  fix, because the old type/schema required `language: string`. */
export interface TipTapCodeBlockNode {
  type: "codeBlock";
  attrs: { language: string | null };
  content?: TipTapTextNode[];
}

/** Info/warning/success/danger/tip — one node type, variant attribute.
 *  Renders via components/shared/callout.tsx, unchanged since the MDX era.
 *  `title` is nullable, not just optional: the Callout NodeView
 *  (lib/editor/extensions/callout.tsx) defines its attribute default as
 *  `null` and explicitly sets it back to `null` (never `undefined`) when
 *  the title input is cleared, so `getJSON()` always emits either a
 *  non-empty string or `null` for this field, never an absent key. */
export interface TipTapCalloutNode {
  type: "callout";
  attrs: { variant: "info" | "tip" | "warning" | "success" | "danger"; title?: string | null };
  content: TipTapBlockNode[];
}

/** Leaf node (no children) — renders via components/shared/command-block.tsx. */
export interface TipTapCommandBlockNode {
  type: "commandBlock";
  attrs: { title: string; commands: string[] };
}

/**
 * Table cells hold BLOCK content (normally a single paragraph), not
 * inline text directly — confirmed against the installed
 * @tiptap/extension-table's real `content: "block+"` and its real attrs
 * (colspan/rowspan/colwidth/align, all with defaults TipTap always fills
 * in on `getJSON()`). The previous contract modeled cells as
 * `{ content: TipTapInlineNode[] }` with no attrs at all, which every
 * table the toolbar's "Table" button actually inserts would fail to
 * satisfy.
 */
export interface TipTapTableCellAttrs {
  colspan?: number;
  rowspan?: number;
  colwidth?: number[] | null;
  align?: "left" | "center" | "right" | "justify" | null;
}

export interface TipTapTableCellNode {
  type: "tableCell" | "tableHeader";
  attrs?: TipTapTableCellAttrs;
  content: TipTapBlockNode[];
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

export type TipTapInlineNode = TipTapTextNode | TipTapHardBreakNode;

export type TipTapBlockNode =
  | TipTapHeadingNode
  | TipTapParagraphNode
  | TipTapBlockquoteNode
  | TipTapHorizontalRuleNode
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
