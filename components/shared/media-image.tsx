"use client";

import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function MediaImage({
  src,
  alt,
  caption,
  alignment,
  size,
}: {
  src: string;
  alt: string;
  caption?: string | null;
  alignment: "left" | "center" | "right" | "wide";
  size: "small" | "medium" | "large" | "full";
}) {
  return (
    <figure
      className={cn(
        "my-8 max-w-full",
        alignment === "center" && "mx-auto",
        alignment === "right" && "ml-auto",
        size === "small" && "w-full sm:max-w-sm",
        size === "medium" && "w-full sm:max-w-xl",
        size === "large" && "w-full sm:max-w-3xl",
        size === "full" && "w-full",
      )}
    >
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative block w-full cursor-zoom-in border border-border bg-surface-2 text-left outline-none transition-colors hover:border-border-strong focus-visible:border-cobalt"
            aria-label={alt ? `Open ${alt} in larger view` : "Open image in larger view"}
          >
            {/* Blob URLs are validated against their Media record before persistence.
                A native image avoids coupling CMS media hosts to next/image config. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="block h-auto max-h-[80vh] w-full object-contain"
            />
            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center border border-border-strong bg-surface-2/95 text-text-dim opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </button>
        </DialogTrigger>

        <DialogContent className="w-[96vw] max-w-[1440px] border-border-strong bg-surface-2 p-3 sm:p-4 [&>button]:right-3 [&>button]:top-3 [&>button]:border [&>button]:border-border-strong [&>button]:bg-surface-2 [&>button]:p-2">
          <div className="flex max-h-[88vh] min-h-0 flex-col pt-8">
            <div className="min-h-0 flex-1 overflow-auto bg-ink/20 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="mx-auto block max-h-[80vh] max-w-full object-contain"
              />
            </div>
            {caption && (
              <p className="border-t border-border px-2 pt-3 text-center text-xs text-text-dim">
                {caption}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {caption && <figcaption className="mt-2 text-center text-xs text-text-dim">{caption}</figcaption>}
    </figure>
  );
}
