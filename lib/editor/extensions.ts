import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { CalloutExtension } from "./extensions/callout";
import { CommandBlockExtension } from "./extensions/command-block";
import { MermaidExtension } from "./extensions/mermaid";

/**
 * The runtime counterpart to types/tiptap.ts + lib/validations/content.ts.
 * Every node type this list produces must match a type in that schema —
 * StarterKit's paragraph/heading/bulletList/orderedList/listItem/codeBlock
 * already do by construction (TipTap's default JSON node names), and
 * Table, TaskList/TaskItem, and Link are configured to match too. The 3
 * custom extensions (Callout, CommandBlock, Mermaid, under
 * lib/editor/extensions/) are hand-written specifically to match the
 * schema's attrs shape.
 *
 * `components/shared/content-renderer.tsx` does NOT import this file —
 * it's a plain recursive function reading the same JSON schema
 * independently (see ARCHITECTURE.md §4 for why). This file is the
 * editor's contract with that schema, not the renderer's.
 */
export function getEditorExtensions() {
  return [
    StarterKit.configure({
      codeBlock: {
        HTMLAttributes: { class: "not-prose" },
      },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: false }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") return "Heading";
        return "Type '/' for commands, or just start writing...";
      },
    }),
    CalloutExtension,
    CommandBlockExtension,
    MermaidExtension,
  ];
}
