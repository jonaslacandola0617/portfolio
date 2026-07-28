import { Download, FileArchive, FileText, Network, Video } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const icons = {
  VIDEO: Video,
  PACKET_TRACER: Network,
  PCAP: Network,
  PDF: FileText,
  ZIP: FileArchive,
  OTHER: FileText,
};

export function MediaAttachment({
  url,
  displayName,
  description,
  fileType,
  fileSize,
}: {
  url: string;
  displayName: string;
  description?: string | null;
  fileType: keyof typeof icons;
  fileSize: number;
}) {
  const Icon = icons[fileType] ?? FileText;
  return (
    <a href={url} target="_blank" rel="noreferrer" download className="not-prose my-6 flex max-w-3xl items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-primary"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
        {description && <span className="mt-1 block text-xs text-muted-foreground">{description}</span>}
        <span className="mt-1 block font-mono text-[0.65rem] text-muted-foreground">{fileType.replace("_", " ")} · {formatBytes(fileSize)}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-primary" />
    </a>
  );
}
