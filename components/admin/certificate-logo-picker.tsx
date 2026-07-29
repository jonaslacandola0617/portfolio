"use client";

import { useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  createMediaRecordAction,
  type AdminMediaItem,
} from "@/lib/services/media-admin-service";
import { guessMediaType } from "@/lib/validations/media";

export function CertificateLogoPicker({
  media,
  initialMediaId = "",
}: {
  media: AdminMediaItem[];
  initialMediaId?: string;
}) {
  const [items, setItems] = useState(media);
  const [selectedId, setSelectedId] = useState(initialMediaId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const images = useMemo(
    () => items.filter((item) => item.type === "IMAGE"),
    [items],
  );
  const selected = images.find((item) => item.id === selectedId);

  const uploadLogo = async (file: File) => {
    setError(null);
    if (guessMediaType(file.name) !== "IMAGE") {
      setError("Choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Certificate logos must be 10 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media/upload",
      });
      const created = await createMediaRecordAction({
        url: blob.url,
        filename: file.name,
        type: "IMAGE",
        size: file.size,
      });
      setItems((current) => [
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
      setSelectedId(created.id);
      success("Certificate logo uploaded.", {
        id: `certificate-logo:${created.id}`,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The logo could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section
      className="overflow-hidden rounded-lg border-2 border-dashed border-border bg-card"
      aria-busy={uploading}
    >
      <input type="hidden" name="logoMediaId" value={selectedId} />
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background sm:h-24 sm:w-24">
          {selected ? (
            // Blob hostnames are dynamic, so this preview intentionally uses a native image element.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.url}
              alt={`${selected.filename} preview`}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <ImageIcon
              className="h-6 w-6 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
            {selected ? "Selected logo" : "Certificate logo"}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {selected?.filename ?? "No logo selected"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {selected
              ? "This image will appear with the certificate on the public site."
              : "Upload an issuer logo or choose an image already in the Media Library."}
          </p>
        </div>
      </div>
      <div className="space-y-3 bg-background/60 p-4">
        {images.length > 0 && (
          <div>
            <label
              htmlFor="certificate-logo-media"
              className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Choose from Media Library
            </label>
            <select
              id="certificate-logo-media"
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setError(null);
              }}
              disabled={uploading}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">No logo</option>
              {images.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.filename}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant={selected ? "outline" : "default"}
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="justify-center"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {uploading
              ? "Uploading..."
              : selected
                ? "Upload replacement"
                : "Upload logo"}
          </Button>
          {selectedId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => {
                setSelectedId("");
                setError(null);
              }}
              className="justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" /> Remove logo
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(event) =>
            event.target.files?.[0] && void uploadLogo(event.target.files[0])
          }
        />
        <p className="text-xs leading-5 text-muted-foreground">
          PNG, JPEG, WebP, or GIF up to 10 MB. Removing a logo keeps the file in
          the Media Library.
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
