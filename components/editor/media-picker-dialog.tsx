"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import {
  FileText,
  ImageIcon,
  Loader2,
  Search,
  UploadCloud,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMediaRecordAction,
  type AdminMediaItem,
} from "@/lib/services/media-admin-service";
import { guessMediaType } from "@/lib/validations/media";

type PickerMode = "image" | "attachment";

export interface MediaImageInsert {
  mediaId: string;
  src: string;
  alt: string;
  caption: string | null;
  alignment: "left" | "center" | "right" | "wide";
  size: "small" | "medium" | "large" | "full";
}

export interface MediaAttachmentInsert {
  mediaId: string;
  url: string;
  displayName: string;
  description: string | null;
  fileType: "VIDEO" | "PACKET_TRACER" | "PCAP" | "PDF" | "ZIP" | "OTHER";
  fileSize: number;
}

export function MediaPickerDialog({
  open,
  mode,
  initialMedia,
  onOpenChange,
  onInsertImage,
  onInsertAttachment,
}: {
  open: boolean;
  mode: PickerMode;
  initialMedia: AdminMediaItem[];
  onOpenChange: (open: boolean) => void;
  onInsertImage: (value: MediaImageInsert) => void;
  onInsertAttachment: (value: MediaAttachmentInsert) => void;
}) {
  const [media, setMedia] = React.useState(initialMedia);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<AdminMediaItem | null>(null);
  const [alt, setAlt] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [alignment, setAlignment] =
    React.useState<MediaImageInsert["alignment"]>("center");
  const [size, setSize] = React.useState<MediaImageInsert["size"]>("large");
  const [displayName, setDisplayName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const choices = media.filter(
    (item) =>
      (mode === "image" ? item.type === "IMAGE" : item.type !== "IMAGE") &&
      item.filename.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  const choose = (item: AdminMediaItem) => {
    setSelected(item);
    setAlt("");
    setCaption("");
    setDisplayName(item.filename);
    setDescription("");
    setError(null);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media/upload",
      });
      const created = await createMediaRecordAction({
        url: blob.url,
        filename: file.name,
        type: guessMediaType(file.name),
        size: file.size,
      });
      setMedia((current) => [created, ...current]);
      choose(created);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const insert = () => {
    if (!selected) return;
    if (mode === "image") {
      if (!alt.trim()) {
        setError("Alternative text is required.");
        return;
      }
      onInsertImage({
        mediaId: selected.id,
        src: selected.url,
        alt: alt.trim(),
        caption: caption.trim() || null,
        alignment,
        size,
      });
    } else {
      if (!displayName.trim()) {
        setError("Display name is required.");
        return;
      }
      onInsertAttachment({
        mediaId: selected.id,
        url: selected.url,
        displayName: displayName.trim(),
        description: description.trim() || null,
        fileType: selected.type as MediaAttachmentInsert["fileType"],
        fileSize: selected.size,
      });
    }
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-6">
        <h2 className="font-display text-lg font-semibold text-text">
          {mode === "image" ? "Insert image" : "Insert file attachment"}
        </h2>
        <p className="mt-1 text-sm text-text-dim">
          Choose a Media Library item or upload a new file.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-border px-3 text-sm text-text hover:bg-surface-3">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload new"}
            <input
              type="file"
              hidden
              disabled={uploading}
              accept={
                mode === "image"
                  ? "image/png,image/jpeg,image/webp,image/gif"
                  : undefined
              }
              onChange={(event) =>
                event.target.files?.[0] &&
                void uploadFile(event.target.files[0])
              }
            />
          </label>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-text-dim" />
            <Input
              aria-label="Search media"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search Media Library"
            />
          </div>
        </div>
        <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-3">
          {choices.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item)}
              className={`overflow-hidden border p-2 text-left ${selected?.id === item.id ? "border-cobalt bg-cobalt-dim" : "border-border"}`}
            >
              <div className="flex h-24 items-center justify-center bg-surface-3">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText className="h-7 w-7 text-text-dim" />
                )}
              </div>
              <p className="mt-2 truncate text-xs font-medium text-text">
                {item.filename}
              </p>
              <p className="font-mono text-[0.62rem] text-text-dim">
                {item.type}
              </p>
            </button>
          ))}
          {!choices.length && (
            <p className="col-span-full py-6 text-center text-sm text-text-dim">
              No matching media.
            </p>
          )}
        </div>

        {selected && mode === "image" && (
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="media-alt">Alternative text</Label>
              <Input
                id="media-alt"
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="media-caption">Caption (optional)</Label>
              <Input
                id="media-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="media-alignment">Alignment</Label>
              <select
                id="media-alignment"
                value={alignment}
                onChange={(event) =>
                  setAlignment(
                    event.target.value as MediaImageInsert["alignment"],
                  )
                }
                className="h-10 w-full border border-border bg-surface px-3 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="wide">Wide</option>
              </select>
            </div>
            <div>
              <Label htmlFor="media-size">Display size</Label>
              <select
                id="media-size"
                value={size}
                onChange={(event) =>
                  setSize(event.target.value as MediaImageInsert["size"])
                }
                className="h-10 w-full border border-border bg-surface px-3 text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full">Full width</option>
              </select>
            </div>
          </div>
        )}

        {selected && mode === "attachment" && (
          <div className="mt-5 grid gap-4 border-t border-border pt-5">
            <div>
              <Label htmlFor="attachment-name">Display name</Label>
              <Input
                id="attachment-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="attachment-description">
                Description (optional)
              </Label>
              <Textarea
                id="attachment-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 border border-vermilion/30 bg-vermilion/5 px-3 py-2 text-sm text-vermilion"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!selected || uploading}
            onClick={insert}
            className="inline-flex h-10 items-center gap-2 bg-text px-4 text-sm font-medium text-surface disabled:opacity-50"
          >
            {mode === "image" ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Insert
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
