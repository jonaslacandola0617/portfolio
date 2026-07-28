"use client";

import { useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { createMediaRecordAction, type AdminMediaItem } from "@/lib/services/media-admin-service";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const images = useMemo(() => items.filter((item) => item.type === "IMAGE"), [items]);
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
      setItems((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSelectedId(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The logo could not be uploaded.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="space-y-3 rounded-md border border-border bg-muted/10 p-3">
      <input type="hidden" name="logoMediaId" value={selectedId} />
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
          {selected ? (
            // Blob hostnames are dynamic, so this preview intentionally uses a native image element.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.url} alt={`${selected.filename} preview`} className="h-full w-full object-contain p-1" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{selected?.filename ?? "No certificate logo selected"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Images are stored in and remain available from the Media Library.</p>
        </div>
      </div>
      {images.length > 0 && (
        <select
          aria-label="Certificate Logo from Media Library"
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value);
            setError(null);
          }}
          disabled={uploading}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
        >
          <option value="">No logo</option>
          {images.map((item) => <option key={item.id} value={item.id}>{item.filename}</option>)}
        </select>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {uploading ? "Uploading..." : selected ? "Replace with upload" : "Upload logo"}
        </Button>
        {selectedId && (
          <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => setSelectedId("")}>
            <X className="h-4 w-4" /> Remove association
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(event) => event.target.files?.[0] && void uploadLogo(event.target.files[0])}
        />
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
