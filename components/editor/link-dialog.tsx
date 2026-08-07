"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link2, Unlink } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function normalizeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function LinkDialog({
  editor,
  open,
  onOpenChange,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
  }, [editor, open]);

  const hasLink = editor.isActive("link");
  const hasSelection = !editor.state.selection.empty;

  function applyLink() {
    const href = normalizeHref(url);
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onOpenChange(false);
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border-strong bg-surface-2 p-0">
        <div className="border-b border-border px-5 py-4 pr-12">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-cobalt" />
            <span className="label text-cobalt">Link</span>
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold text-text">
            {hasLink ? "Edit hyperlink" : "Add hyperlink"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-text-dim">
            {hasSelection || hasLink
              ? "Enter the destination for the selected text."
              : "Select some text in the editor first, then add its destination."}
          </p>
        </div>

        <div className="space-y-2 px-5 py-5">
          <label htmlFor="editor-link-url" className="label block">
            Destination URL
          </label>
          <input
            id="editor-link-url"
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (hasSelection || hasLink) applyLink();
              }
            }}
            placeholder="https://example.com"
            className="h-10 w-full border border-border bg-surface px-3 font-mono text-sm text-text outline-none placeholder:text-muted focus:border-cobalt"
          />
          <p className="text-[11px] leading-5 text-muted">
            Plain domains are automatically prefixed with https://. Relative paths, mailto:, tel:, and #anchors are also supported.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <div>
            {hasLink && (
              <button
                type="button"
                onClick={removeLink}
                className="inline-flex h-9 items-center gap-2 border border-vermilion px-3 text-sm text-vermilion transition-colors hover:bg-vermilion/10"
              >
                <Unlink className="h-3.5 w-3.5" /> Remove link
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 border border-border px-3 text-sm text-text-dim transition-colors hover:border-border-strong hover:text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!(hasSelection || hasLink) || !url.trim()}
              onClick={applyLink}
              className="h-9 border border-border-strong bg-text px-3 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hasLink ? "Update link" : "Add link"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
