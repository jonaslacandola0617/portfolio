"use client";

import * as React from "react";
import { FileText, FileArchive, Video, Network, Check, Copy, Trash2 } from "lucide-react";
import { deleteMediaAction } from "@/lib/services/media-admin-service";

const typeIcon: Record<string, typeof FileText> = {
  IMAGE: FileText,
  VIDEO: Video,
  PACKET_TRACER: Network,
  PCAP: Network,
  PDF: FileText,
  ZIP: FileArchive,
  OTHER: FileText,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaCard({
  media,
}: {
  media: { id: string; url: string; filename: string; type: string; size: number };
}) {
  const [copied, setCopied] = React.useState(false);
  const Icon = typeIcon[media.type] ?? FileText;

  function copyUrl() {
    navigator.clipboard.writeText(media.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex h-32 items-center justify-center border-b border-border bg-muted/30">
        {media.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.filename} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-foreground">{media.filename}</p>
        <p className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
          {media.type} · {formatBytes(media.size)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[0.65rem] text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            {copied ? "copied" : "copy url"}
          </button>
          <form
            action={async () => {
              if (confirm(`Delete ${media.filename}? This can't be undone.`)) {
                await deleteMediaAction(media.id);
              }
            }}
          >
            <button className="flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[0.65rem] text-muted-foreground hover:border-destructive/40 hover:text-destructive">
              <Trash2 className="h-3 w-3" />
              delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
