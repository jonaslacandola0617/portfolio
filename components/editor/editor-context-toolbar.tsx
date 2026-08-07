"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { EditorToolbar } from "@/components/editor/toolbar";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import type {
  ContentTemplate,
  TemplateContentType,
} from "@/lib/editor/templates";

export interface EditorContextPosition {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

export function EditorContextToolbar({
  editor,
  position,
  media,
  contentType,
  onApplyTemplate,
  onDismiss,
}: {
  editor: Editor | null;
  position: EditorContextPosition | null;
  media: AdminMediaItem[];
  contentType?: TemplateContentType;
  onApplyTemplate?: (template: ContentTemplate) => void;
  onDismiss: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && panelRef.current?.contains(target)) return;
      onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss, position]);

  return (
    <div
      ref={panelRef}
      className={`fixed z-40 max-w-[calc(100vw-2rem)] border border-border-strong bg-surface-2 ${
        position ? "visible pointer-events-auto" : "invisible pointer-events-none"
      }`}
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        transform: position
          ? `translate(${position.flipX ? "-100%" : "0"}, ${position.flipY ? "-100%" : "0"})`
          : undefined,
      }}
      role="toolbar"
      aria-label="Editor context tools"
    >
      <div className="thin-scroll flex max-w-[min(760px,calc(100vw-2rem))] items-center gap-1 overflow-x-auto px-2 py-2">
        <EditorToolbar
          editor={editor}
          media={media}
          contentType={contentType}
          onApplyTemplate={onApplyTemplate}
        />
      </div>
    </div>
  );
}
