import { cn } from "@/lib/utils";

type ProjectVisualPreviewProps = {
  title: string;
  liveSiteUrl?: string | null;
  thumbnail?: string | null;
  className?: string;
};

export function ProjectVisualPreview({
  title,
  liveSiteUrl,
  thumbnail,
  className,
}: ProjectVisualPreviewProps) {
  const hasLivePreview = Boolean(liveSiteUrl);
  const hasImage = Boolean(thumbnail);

  return (
    <div
      className={cn("project-visual-preview", hasLivePreview && "has-live-preview", className)}
      style={hasImage ? { backgroundImage: `url(${thumbnail})` } : undefined}
      aria-hidden="true"
    >
      {hasLivePreview ? (
        <iframe
          src={liveSiteUrl!}
          title={`${title} live website preview`}
          loading="lazy"
          tabIndex={-1}
          sandbox="allow-forms allow-same-origin allow-scripts"
          referrerPolicy="no-referrer"
        />
      ) : null}
      {!hasLivePreview && !hasImage ? <span>{title}</span> : null}
    </div>
  );
}
