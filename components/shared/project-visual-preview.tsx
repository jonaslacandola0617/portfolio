import { cn } from "@/lib/utils";

type ProjectVisualPreviewProps = {
  title: string;
  liveSiteUrl?: string | null;
  thumbnail?: string | null;
  className?: string;
  /** Load the image eagerly (above-the-fold usage). */
  priority?: boolean;
};

function hostOf(url?: string | null) {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * A browser-window frame around the project screenshot. Uses the stored
 * thumbnail; only falls back to a lazy live iframe when no image exists, so
 * index pages no longer boot several full websites at once.
 */
export function ProjectVisualPreview({ title, liveSiteUrl, thumbnail, className, priority }: ProjectVisualPreviewProps) {
  const host = hostOf(liveSiteUrl);

  return (
    <div className={cn("browser-frame", className)} aria-hidden="true">
      <div className="browser-bar">
        <span className="browser-dots"><i /><i /><i /></span>
        <span className="browser-url">{host ?? title.toLowerCase()}</span>
      </div>
      <div className="browser-viewport">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
        ) : liveSiteUrl ? (
          <iframe
            src={liveSiteUrl}
            title={`${title} live website preview`}
            loading="lazy"
            tabIndex={-1}
            sandbox="allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="browser-placeholder">{title}</span>
        )}
      </div>
    </div>
  );
}
