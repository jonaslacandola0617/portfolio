"use client";

import * as React from "react";
import { FileText, FileArchive, Video, Network, ImageIcon, Check, Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMediaAction } from "@/lib/services/media-admin-service";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";

const typeIcon: Record<string, typeof FileText> = { IMAGE: ImageIcon, VIDEO: Video, PACKET_TRACER: Network, PCAP: Network, PDF: FileText, ZIP: FileArchive, OTHER: FileText };
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export function MediaCard({ media }: { media: { id: string; url: string; filename: string; type: string; size: number } }) {
  const [copied, setCopied] = React.useState(false);
  const router = useRouter();
  const Icon = typeIcon[media.type] ?? FileText;
  function copyUrl() { void navigator.clipboard.writeText(media.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return (
    <div className="group overflow-hidden border border-border bg-surface-2">
      <div className={`flex h-36 items-center justify-center border-b border-border ${media.type === "IMAGE" ? "bg-cobalt-dim" : "bg-surface-3"}`}>
        {media.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.filename} className="h-full w-full object-cover" />
        ) : <Icon className="h-6 w-6 text-muted" />}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-text">{media.filename}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted">{formatBytes(media.size)}</p>
        <div className="mt-3 flex gap-1.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button type="button" onClick={copyUrl} className="flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-text-dim hover:text-text">
            {copied ? <Check className="h-3 w-3 text-teal" /> : <Copy className="h-3 w-3" />} {copied ? "copied" : "copy url"}
          </button>
          <DeleteConfirmationDialog
            contentType="media file" recordTitle={media.filename}
            description="This will permanently remove the file from storage and the media library. Content that references its URL may display a broken asset."
            confirmLabel="Delete media" onConfirm={() => deleteMediaAction(media.id)} onSuccess={() => router.refresh()}
            trigger={<button type="button" className="flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-text-dim hover:border-vermilion hover:text-vermilion"><Trash2 className="h-3 w-3" /> delete</button>}
          />
        </div>
      </div>
    </div>
  );
}
