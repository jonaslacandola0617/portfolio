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
        size === "full" && "w-full"
      )}
    >
      {/* Blob URLs are validated against their Media record before persistence.
          A native image avoids coupling CMS media hosts to next/image config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="h-auto max-h-[80vh] w-full rounded-lg border border-border object-contain" />
      {caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
