"use client";

import { X } from "lucide-react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

export function MediaImageNodeView({
  node,
  selected,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const { src, alt, caption, alignment, size } = node.attrs;

  function selectNode() {
    const pos = getPos();
    if (typeof pos === "number") editor.commands.setNodeSelection(pos);
  }

  return (
    <NodeViewWrapper
      className={cn(
        "my-8 max-w-full",
        alignment === "center" && "mx-auto",
        alignment === "right" && "ml-auto",
        size === "small" && "w-full sm:max-w-sm",
        size === "medium" && "w-full sm:max-w-xl",
        size === "large" && "w-full sm:max-w-3xl",
        size === "full" && "w-full",
      )}
      data-media-image=""
    >
      <figure
        className={cn(
          "relative m-0 border bg-surface-2 transition-colors",
          selected ? "border-cobalt" : "border-border",
        )}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          selectNode();
        }}
      >
        {selected && (
          <button
            type="button"
            contentEditable={false}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => deleteNode()}
            aria-label="Remove image"
            title="Remove image"
            className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center border border-vermilion bg-surface-2 text-vermilion transition-colors hover:bg-vermilion hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          className="block h-auto max-h-[80vh] w-full object-contain"
        />

        {caption && (
          <figcaption className="border-t border-border px-3 py-2 text-center text-xs text-text-dim">
            {caption}
          </figcaption>
        )}

        {selected && (
          <span
            contentEditable={false}
            className="pointer-events-none absolute bottom-2 right-2 border border-cobalt bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cobalt"
          >
            Selected · Delete / Backspace
          </span>
        )}
      </figure>
    </NodeViewWrapper>
  );
}
