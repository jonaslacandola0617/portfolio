"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContentTemplate, TemplateContentType } from "@/lib/editor/templates";
import { getEditorExtensions } from "@/lib/editor/extensions";
import { EditorToolbar } from "@/components/editor/toolbar";
import {
  EditorContextToolbar,
  type EditorContextPosition,
} from "@/components/editor/editor-context-toolbar";
import { useAutosave } from "@/hooks/use-autosave";
import {
  serializeTipTapDocument,
  TipTapSerializationError,
} from "@/lib/editor/serialize-content";
import type { SaveContentPayload, SaveResult } from "@/types/admin";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import { useAuthoringEditorHeader } from "@/components/admin/authoring-workspace";

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
  documentTitle?: string;
}

export function EditorShell({
  initialContent,
  recordId,
  contentType,
  onSave,
  onReady,
  media = [],
  documentTitle,
}: EditorShellProps) {
  const [contextPosition, setContextPosition] = useState<EditorContextPosition | null>(null);
  const invokeSave = useCallback(
    async (editorOutput: unknown, clientRevision: number): Promise<SaveResult> => {
      try {
        const content = serializeTipTapDocument(editorOutput);
        return await onSave({ id: recordId, content, clientRevision });
      } catch (error) {
        const serializationError =
          error instanceof TipTapSerializationError
            ? error
            : new TipTapSerializationError(
                "The editor output could not be serialized.",
                "content",
              );
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
    [contentType, onSave, recordId],
  );

  const {
    status,
    errorMessage,
    notifyChange,
    flush,
    retry,
    isSaving,
    hasUnsavedChanges,
  } = useAutosave<unknown>(invokeSave, 2000, `cms:${contentType}:${recordId}:content`);

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose-docs min-h-[520px] focus:outline-none" },
    },
    onUpdate: ({ editor }) => notifyChange(editor.getJSON()),
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

  const applyTemplate = useCallback(
    (template: ContentTemplate) => {
      if (!editor) return;
      editor.commands.setContent(template.document, { emitUpdate: true });
      editor.commands.focus();
    },
    [editor],
  );

  const dismissContextToolbar = useCallback(() => {
    setContextPosition(null);
  }, []);

  const openContextToolbar = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editor) return;
      event.preventDefault();

      const resolved = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });
      if (resolved) {
        const { from, to } = editor.state.selection;
        if (from === to || resolved.pos < from || resolved.pos > to) {
          editor.commands.setTextSelection(resolved.pos);
        }
      }
      editor.commands.focus();

      const flipX = event.clientX > window.innerWidth / 2;
      const flipY = event.clientY > window.innerHeight / 2;
      setContextPosition({
        x: event.clientX + (flipX ? -8 : 8),
        y: event.clientY + (flipY ? -8 : 8),
        flipX,
        flipY,
      });
    },
    [editor],
  );

  useEffect(() => {
    if (!onReady) return;
    if (!editor) {
      onReady(null);
      return;
    }
    onReady({ flush: flushCurrent, hasUnsavedChanges });
    return () => onReady(null);
  }, [editor, flushCurrent, hasUnsavedChanges, onReady]);

  const headerState = useMemo(
    () =>
      editor
        ? {
            status,
            errorMessage,
            isSaving,
            save: () => {
              void flushCurrent();
            },
            retry,
          }
        : null,
    [editor, errorMessage, flushCurrent, isSaving, retry, status],
  );
  useAuthoringEditorHeader(headerState);

  const toolbarContentType =
    contentType === "certificate"
      ? undefined
      : (contentType as TemplateContentType);
  const toolbarApplyTemplate =
    contentType === "certificate" ? undefined : applyTemplate;

  return (
    <div className="editor-workspace flex h-full min-h-0 flex-col bg-surface">
      <div className="z-10 shrink-0 border-b border-border bg-surface/95 backdrop-blur">
        <div className="thin-scroll flex items-center gap-1 overflow-x-auto px-5 pb-2.5">
          <EditorToolbar
            editor={editor}
            media={media}
            contentType={toolbarContentType}
            onApplyTemplate={toolbarApplyTemplate}
          />
        </div>
      </div>

      <div
        className="thin-scroll min-h-0 flex-1 overflow-auto bg-surface px-5 py-8 sm:px-10 lg:px-0"
        onScroll={dismissContextToolbar}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-semibold text-text sm:text-4xl">
            {documentTitle || "Untitled Draft"}
          </h1>
          <div className="mt-8" onContextMenu={openContextToolbar}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <EditorContextToolbar
        editor={editor}
        position={contextPosition}
        media={media}
        contentType={toolbarContentType}
        onApplyTemplate={toolbarApplyTemplate}
        onDismiss={dismissContextToolbar}
      />
    </div>
  );
}
