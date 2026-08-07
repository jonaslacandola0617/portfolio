"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { createMediaRecordAction } from "@/lib/services/media-admin-service";
import { guessMediaType } from "@/lib/validations/media";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function MediaUpload() {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { success } = useToast();

  async function handleFiles(files: FileList) {
    setUploading(true); setError(null); let uploadedCount = 0;
    for (const file of Array.from(files)) {
      try {
        const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/media/upload" });
        await createMediaRecordAction({ url: blob.url, filename: file.name, type: guessMediaType(file.name), size: file.size });
        uploadedCount += 1;
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to upload ${file.name}.`);
      }
    }
    setUploading(false);
    if (uploadedCount > 0) success(`${uploadedCount} ${uploadedCount === 1 ? "file" : "files"} uploaded.`, { id: `media-upload:${Date.now()}` });
    router.refresh();
  }

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files); }}
      className={cn("flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center transition-colors sm:gap-4", dragging ? "border-cobalt bg-cobalt-dim" : "border-border-strong bg-surface-2")}
    >
      <input ref={inputRef} type="file" multiple hidden onChange={(event) => event.target.files && void handleFiles(event.target.files)} />
      {uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted" /> : <UploadCloud className="h-6 w-6 text-muted" />}
      <div>
        <p className="text-sm text-text">
          {uploading ? "Uploading…" : "Drag files here, or "}
          {!uploading && <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-cobalt">click to upload</button>}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">Images, PDF, ZIP, PCAP, Packet Tracer (.pkt), video</p>
      </div>
      {error && <p className="mt-3 text-xs text-vermilion">{error}</p>}
    </div>
  );
}
