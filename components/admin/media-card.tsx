"use client";

import * as React from "react";
import {
  FileText,
  FileArchive,
  Video,
  Network,
  ImageIcon,
  Check,
  Copy,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMediaAction } from "@/lib/services/media-admin-service";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";

const typeIcon: Record<string, typeof FileText> = {
  IMAGE: ImageIcon,
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
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const router = useRouter();
  const Icon = typeIcon[media.type] ?? FileText;

  function copyUrl() {
    void navigator.clipboard.writeText(media.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="group flex w-full flex-col border border-border bg-surface-2 text-left transition-colors hover:border-border-strong"
      >
        <div
          className={`flex aspect-video w-full items-center justify-center overflow-hidden ${
            media.type === "IMAGE" ? "bg-cobalt-dim" : "bg-surface-3"
          }`}
        >
          {media.type === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt={media.filename}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon className="h-[22px] w-[22px] text-text-dim" />
          )}
        </div>
        <div className="w-full px-3 py-2.5">
          <p className="truncate text-xs font-medium text-text">{media.filename}</p>
          <p className="mt-0.5 text-[11px] text-muted">{formatBytes(media.size)}</p>
        </div>
      </button>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${media.filename}`}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md border border-border-strong bg-surface-2"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="truncate text-sm font-medium text-text">{media.filename}</p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
                className="text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className={`flex aspect-video items-center justify-center overflow-hidden ${
                media.type === "IMAGE" ? "bg-cobalt-dim" : "bg-surface-3"
              }`}
            >
              {media.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.url}
                  alt={media.filename}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Icon className="h-9 w-9 text-text-dim" />
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-muted">{formatBytes(media.size)}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyUrl}
                  className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-text-dim hover:text-text"
                >
                  {copied ? <Check className="h-3 w-3 text-teal" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy URL"}
                </button>
                <DeleteConfirmationDialog
                  contentType="media file"
                  recordTitle={media.filename}
                  description="This will permanently remove the file from storage and the media library. Content that references its URL may display a broken asset."
                  confirmLabel="Delete media"
                  onConfirm={() => deleteMediaAction(media.id)}
                  onSuccess={() => {
                    setPreviewOpen(false);
                    router.refresh();
                  }}
                  trigger={
                    <button
                      type="button"
                      className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-vermilion"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
