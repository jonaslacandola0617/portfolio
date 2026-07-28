"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { useCallback, useEffect } from "react";
import { getEditorExtensions } from "@/lib/editor/extensions";
import { EditorToolbar } from "@/components/editor/toolbar";
import { SaveStatusIndicator } from "@/components/editor/save-status";
import { useAutosave } from "@/hooks/use-autosave";
import {
  serializeTipTapDocument,
  TipTapSerializationError,
} from "@/lib/editor/serialize-content";
import type { SaveContentPayload, SaveResult } from "@/types/admin";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import type { ContentTemplate, TemplateContentType } from "@/lib/editor/templates";

export interface EditorSaveController {
  flush: () => Promise<SaveResult>;
  hasUnsavedChanges: () => boolean;
}

interface EditorShellProps {
  initialContent: JSONContent;
  recordId: string;
  contentType: "project" | "lab" | "article" | "certificate";
  onSave: (payload: SaveContentPayload) => Promise<SaveResult>;
  onReady?: (controller: EditorSaveController | null) => void;
  media?: AdminMediaItem[];
}

export function EditorShell({
  initialContent,
  recordId,
  contentType,
  onSave,
  onReady,
  media = [],
}: EditorShellProps) {
  const invokeSave = useCallback(
    async (editorOutput: unknown, clientRevision: number): Promise<SaveResult> => {
      try {
        const content = serializeTipTapDocument(editorOutput);
        return await onSave({ id: recordId, content, clientRevision });
      } catch (error) {
        const serializationError =
          error instanceof TipTapSerializationError
            ? error
            : new TipTapSerializationError("The editor output could not be serialized.", "content");
        console.error(`[editor:${contentType}:autosave] serialization failed`, {
          contentType,
          recordId,
          operation: "autosave",
          validationStage: "client-serialization",
          path: serializationError.path,
          message: serializationError.message,
        });
        return {
          success: false,
          code: "SERIALIZATION_ERROR",
          message: `This content cannot be saved: ${serializationError.message}`,
          revision: clientRevision,
        };
      }
    },
    [contentType, onSave, recordId]
  );

  const { status, errorMessage, notifyChange, flush, retry, isSaving, hasUnsavedChanges } =
    useAutosave<unknown>(invokeSave, 2000, `cms:${contentType}:${recordId}:content`);

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

  const flushCurrent = useCallback(async () => {
    if (!editor) {
      return {
        success: false,
        code: "UNKNOWN_ERROR",
        message: "The editor is still loading. Try again in a moment.",
      } satisfies SaveResult;
    }
    return flush(editor.getJSON());
  }, [editor, flush]);

  const applyTemplate = useCallback((template: ContentTemplate) => {
    if (!editor) return;
    editor.commands.setContent(template.document, { emitUpdate: true });
    editor.commands.focus();
  }, [editor]);

  useEffect(() => {
    if (!onReady) return;
    if (!editor) {
      onReady(null);
      return;
    }
    onReady({ flush: flushCurrent, hasUnsavedChanges });
    return () => onReady(null);
  }, [editor, flushCurrent, hasUnsavedChanges, onReady]);

  return (
    <div className="editor-workspace">
      <div className="sticky top-0 z-20 mb-2 flex items-center justify-between border-b border-border/70 bg-background/95 py-2 backdrop-blur">
        <EditorToolbar
          editor={editor}
          media={media}
          contentType={contentType === "certificate" ? undefined : contentType as TemplateContentType}
          onApplyTemplate={contentType === "certificate" ? undefined : applyTemplate}
        />
      </div>
      <div className="overflow-x-auto rounded-b-lg border border-border bg-background">
        <EditorContent editor={editor} />
      </div>
      <div className="mt-2 flex items-start justify-between gap-4">
        <SaveStatusIndicator status={status} errorMessage={errorMessage} onRetry={retry} />
        <button
          type="button"
          onClick={() => void flushCurrent()}
          disabled={isSaving}
          aria-disabled={isSaving}
          className="shrink-0 font-mono text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save now"}
        </button>
      </div>
    </div>
  );
}
