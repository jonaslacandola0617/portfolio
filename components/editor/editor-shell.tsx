"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { getEditorExtensions } from "@/lib/editor/extensions";
import { EditorToolbar } from "@/components/editor/toolbar";
import { SaveStatusIndicator } from "@/components/editor/save-status";
import { useAutosave } from "@/hooks/use-autosave";
import type { AutosaveResult } from "@/types/admin";

interface EditorShellProps {
  initialContent: JSONContent;
  /** Returns a structured result rather than throwing — see
   *  types/admin.ts's AutosaveResult and
   *  docs/PRE_PHASE_6_STABILIZATION_REPORT.md Workstream A. A rejected
   *  Promise here used to leave the UI with no safe message to show and
   *  no way to distinguish "still trying" from "gave up." */
  onSave: (content: JSONContent) => Promise<AutosaveResult>;
  /** Exposes the editor's current JSON to the parent form on demand
   *  (e.g. when the surrounding metadata form submits) without making
   *  the parent re-render on every keystroke. */
  onReady?: (getContent: () => JSONContent) => void;
}

export function EditorShell({ initialContent, onSave, onReady }: EditorShellProps) {
  const { status, errorMessage, notifyChange, saveNow, retry, isSaving } = useAutosave<JSONContent>(onSave);

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-docs min-h-[400px] px-4 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      notifyChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && onReady) {
      onReady(() => editor.getJSON());
    }
  }, [editor, onReady]);

  const saving = isSaving();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <EditorToolbar editor={editor} />
      </div>
      <div className="rounded-b-lg border border-border bg-background">
        <EditorContent editor={editor} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <SaveStatusIndicator status={status} errorMessage={errorMessage} onRetry={retry} />
        <button
          type="button"
          onClick={() => editor && saveNow(editor.getJSON())}
          disabled={saving}
          aria-disabled={saving}
          className="font-mono text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save now"}
        </button>
      </div>
    </div>
  );
}
