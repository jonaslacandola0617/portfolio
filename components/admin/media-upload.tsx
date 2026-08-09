"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { createMediaRecordAction } from "@/lib/services/media-admin-service";
import { guessMediaType } from "@/lib/validations/media";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const SAVE_TIMEOUT_MS = 30 * 1000;

type UploadStage = "idle" | "uploading" | "saving";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export function MediaUpload() {
  const [uploading, setUploading] = React.useState(false);
  const [stage, setStage] = React.useState<UploadStage>("idle");
  const [progress, setProgress] = React.useState(0);
  const [currentFile, setCurrentFile] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { success } = useToast();

  async function handleFiles(files: FileList) {
    if (uploading || files.length === 0) return;

    setUploading(true);
    setError(null);
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        setCurrentFile(file.name);
        setStage("uploading");
        setProgress(0);

        try {
          const abortController = new AbortController();
          const uploadTimeout = window.setTimeout(
            () => abortController.abort(),
            UPLOAD_TIMEOUT_MS,
          );

          let blob: Awaited<ReturnType<typeof upload>>;
          try {
            blob = await upload(file.name, file, {
              access: "public",
              handleUploadUrl: "/api/admin/media/upload",
              abortSignal: abortController.signal,
              onUploadProgress: ({ percentage }) => {
                setProgress(Math.max(0, Math.min(100, Math.round(percentage))));
              },
            });
          } finally {
            window.clearTimeout(uploadTimeout);
          }

          setStage("saving");
          setProgress(100);

          await withTimeout(
            createMediaRecordAction({
              url: blob.url,
              filename: file.name,
              type: guessMediaType(file.name),
              size: file.size,
            }),
            SAVE_TIMEOUT_MS,
            `${file.name} reached storage, but saving it to the Media Library timed out. Refresh the page before retrying.`,
          );

          uploadedCount += 1;
        } catch (err) {
          const message =
            err instanceof DOMException && err.name === "AbortError"
              ? `${file.name} took too long to upload and was cancelled. Please try again.`
              : err instanceof Error
                ? err.message
                : `Failed to upload ${file.name}.`;
          setError(message);
        }
      }
    } finally {
      setUploading(false);
      setStage("idle");
      setProgress(0);
      setCurrentFile(null);
      if (inputRef.current) inputRef.current.value = "";

      if (uploadedCount > 0) {
        success(`${uploadedCount} ${uploadedCount === 1 ? "file" : "files"} uploaded.`, {
          id: `media-upload:${Date.now()}`,
        });
      }

      // The Media page is server-rendered from Postgres. Refresh after every
      // attempt so a record that completed just before/after a slow response
      // becomes visible without leaving the uploader locked in a loading state.
      router.refresh();
    }
  }

  const statusText =
    stage === "saving"
      ? "Saving to Media Library…"
      : stage === "uploading"
        ? `Uploading… ${progress}%`
        : "Drag files here, or ";

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!uploading) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!uploading && event.dataTransfer.files.length) {
          void handleFiles(event.dataTransfer.files);
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center transition-colors sm:gap-4",
        dragging ? "border-cobalt bg-cobalt-dim" : "border-border-strong bg-surface-2",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        disabled={uploading}
        onChange={(event) => event.target.files && void handleFiles(event.target.files)}
      />

      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-cobalt" />
      ) : (
        <UploadCloud className="h-6 w-6 text-muted" />
      )}

      <div className="w-full max-w-sm">
        <p className="text-sm text-text">
          {statusText}
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-cobalt"
            >
              click to upload
            </button>
          )}
        </p>
        {uploading && currentFile && (
          <p className="mt-1 truncate font-mono text-[11px] text-muted">{currentFile}</p>
        )}
        {stage === "uploading" && (
          <div className="mt-3 h-1 w-full bg-surface-3" aria-label={`Upload progress ${progress}%`}>
            <div
              className="h-full bg-cobalt transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="mt-1 font-mono text-xs text-muted">
          Images, PDF, ZIP, PCAP, Packet Tracer (.pkt), video
        </p>
      </div>

      {error && <p className="mt-3 max-w-lg text-xs leading-5 text-vermilion">{error}</p>}
    </div>
  );
}
