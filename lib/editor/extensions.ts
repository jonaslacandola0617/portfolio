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
import { MediaAttachmentExtension, MediaImageExtension } from "./extensions/media";
import { ProofreadingExtension } from "./proofreading";
import { AIAuthenticityExtension } from "./ai-authenticity";

/**
 * The runtime counterpart to types/tiptap.ts + lib/validations/content.ts.
 * Every node type this list produces must match a type in that schema —
 * StarterKit's paragraph/heading/blockquote/horizontalRule/bulletList/
 * orderedList/listItem/codeBlock already do by construction (TipTap's
 * default JSON node names), and Table, TaskList/TaskItem, and Link are
 * configured to match too. The custom schema extensions under
 * lib/editor/extensions/ are hand-written specifically to match the
 * schema's attrs shape. ProofreadingExtension and AIAuthenticityExtension
 * are editor-only behavior and deliberately add no node or mark to saved
 * content.
 *
 * `components/shared/content-renderer.tsx` does NOT import this file —
 * it's a plain recursive function reading the same JSON schema
 * independently (see ARCHITECTURE.md §4 for why). This file is the
 * editor's contract with that schema, not the renderer's.
 *
 * `link: false` and `underline: false`/`strike: false` below were added
 * during the pre-Phase-6 stabilization pass after auditing the installed
 * `@tiptap/starter-kit@3.x` (a newer major version than this file's
 * original comments assumed) against `types/tiptap.ts`:
 *   - StarterKit v3 bundles its OWN `Link` extension by default now.
 *     Without `link: false`, this file registered a SECOND `Link` node
 *     (this one, configured with `openOnClick`/`autolink`) alongside
 *     StarterKit's default-configured one — same node name twice, which
 *     TipTap logs a "Duplicate extension names found" warning for and
 *     which puts our actual Link config at the mercy of extension
 *     ordering. `link: false` makes this file's explicit `Link.configure(...)`
 *     the only one that exists.
 *   - StarterKit v3 also bundles `Underline` by default — no toolbar
 *     button exists for it, but its default keyboard shortcut (Cmd/Ctrl+U)
 *     was still live, and `underline` has no entry in
 *     types/tiptap.ts/content.ts, so a document containing one would fail
 *     `safeParse()` in the autosave Server Action. `strike` (Cmd/Ctrl+Shift+S)
 *     has the identical problem. Both are disabled here rather than
 *     given a schema, since neither is an intentionally exposed editor
 *     capability — there's no toolbar button, so there's nothing for a
 *     user to discover, and no existing content can contain either mark
 *     (there was never a way to produce one through the UI).
 */
export function getEditorExtensions() {
  return [
    StarterKit.configure({
      code: {
        HTMLAttributes: { spellcheck: "false" },
      },
      codeBlock: {
        HTMLAttributes: { class: "not-prose", spellcheck: "false" },
      },
      link: false,
      underline: false,
      strike: false,
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
    MediaImageExtension,
    MediaAttachmentExtension,
    ProofreadingExtension,
    AIAuthenticityExtension,
  ];
}
