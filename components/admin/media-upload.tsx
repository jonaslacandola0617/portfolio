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
    setUploading(true);
    setError(null);
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/media/upload",
        });
        await createMediaRecordAction({
          url: blob.url,
          filename: file.name,
          type: guessMediaType(file.name),
          size: file.size,
        });
        uploadedCount += 1;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to upload ${file.name}. Is BLOB_READ_WRITE_TOKEN configured?`,
        );
      }
    }

    setUploading(false);
    if (uploadedCount > 0) {
      success(
        `${uploadedCount} ${uploadedCount === 1 ? "file" : "files"} uploaded.`,
        { id: `media-upload:${Date.now()}` },
      );
    }
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      )}
      <p className="mt-3 text-sm text-foreground">
        {uploading ? "Uploading..." : "Drag files here, or"}{" "}
        {!uploading && (
          <button
            onClick={() => inputRef.current?.click()}
            className="text-primary hover:underline"
          >
            browse
          </button>
        )}
      </p>
      <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">
        Images, PDF, ZIP, PCAP, Packet Tracer (.pkt), video
      </p>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
