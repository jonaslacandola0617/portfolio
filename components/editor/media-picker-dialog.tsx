"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import {
  Check,
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
import { cn } from "@/lib/utils";
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

function ChoiceStrip<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="label mb-2">{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid border border-border-strong bg-surface"
        style={{
          gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-9 px-2 py-2 text-[11px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt",
                index > 0 && "border-l border-border",
                active
                  ? "bg-text text-surface"
                  : "bg-surface text-text-dim hover:bg-surface-3 hover:text-text",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
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

  const modeLabel = mode === "image" ? "IMAGE" : "ATTACHMENT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,1080px)] max-w-5xl overflow-hidden border-border-strong bg-surface p-0">
        <div className="grid max-h-[90vh] grid-rows-[auto_minmax(0,1fr)]">
          <header className="relative border-b border-border-strong bg-surface-2 px-5 py-5 pr-12 sm:px-6">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-cobalt" />
            <div className="flex items-start justify-between gap-6 pl-2">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-cobalt">
                    MEDIA / {modeLabel}
                  </span>
                  <span className="h-2 w-2 bg-signal" aria-hidden="true" />
                  <span className="h-2 w-2 bg-vermilion" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-text">
                  {mode === "image" ? "Insert image" : "Insert file attachment"}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-text-dim">
                  Choose something from the Media Library or upload a new file,
                  then configure how it appears in the entry.
                </p>
              </div>
              <div className="hidden shrink-0 border border-border px-3 py-2 font-mono text-[10px] text-text-dim sm:block">
                01 SELECT → 02 CONFIGURE
              </div>
            </div>
          </header>

          <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)] lg:overflow-hidden">
            <section className="min-h-0 border-b border-border-strong bg-surface lg:border-b-0 lg:border-r">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="label">01 / Select media</p>
                  <span className="font-mono text-[10px] text-text-dim">
                    {choices.length} {choices.length === 1 ? "ITEM" : "ITEMS"}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-border-strong bg-text px-4 text-xs font-medium text-surface transition-colors hover:bg-cobalt">
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

                  <div className="relative">
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
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-4 sm:p-5 lg:max-h-none lg:h-[calc(90vh-190px)]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {choices.map((item, index) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => choose(item)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group/media relative overflow-hidden border bg-surface-2 p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                          isSelected
                            ? "border-cobalt"
                            : "border-border hover:border-border-strong",
                        )}
                      >
                        <div className="relative flex h-28 items-center justify-center overflow-hidden bg-surface-3">
                          {item.type === "IMAGE" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-200 group-hover/media:scale-[1.02]"
                            />
                          ) : (
                            <FileText className="h-7 w-7 text-text-dim" />
                          )}
                          <span className="absolute left-2 top-2 bg-surface/90 px-1.5 py-1 font-mono text-[9px] text-text-dim">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-cobalt text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="mt-2 truncate text-xs font-medium text-text">
                          {item.filename}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] tracking-wide text-text-dim">
                          {item.type}
                        </p>
                        {isSelected && (
                          <span className="absolute inset-x-0 bottom-0 h-1 bg-cobalt" />
                        )}
                      </button>
                    );
                  })}

                  {!choices.length && (
                    <div className="col-span-full border border-dashed border-border px-6 py-12 text-center">
                      <p className="font-display text-sm font-semibold text-text">
                        No matching media
                      </p>
                      <p className="mt-1 text-xs text-text-dim">
                        Try another search or upload a new file.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="min-h-0 bg-surface-2 lg:overflow-y-auto">
              <div className="border-b border-border px-5 py-4">
                <p className="label">02 / Configure</p>
              </div>

              {!selected ? (
                <div className="flex min-h-64 flex-col justify-between p-5 sm:p-6 lg:min-h-full">
                  <div>
                    <span className="mb-5 block h-12 w-12 border border-border-strong bg-surface" />
                    <h3 className="font-display text-base font-semibold text-text">
                      Choose {mode === "image" ? "an image" : "a file"} first
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-dim">
                      Select a Media Library item on the left. Its display options
                      will appear here without leaving the editor.
                    </p>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-1" aria-hidden="true">
                    <span className="h-2 bg-cobalt" />
                    <span className="h-2 bg-signal" />
                    <span className="h-2 bg-vermilion" />
                  </div>
                </div>
              ) : (
                <div className="space-y-5 p-5 sm:p-6">
                  <div className="border border-border bg-surface p-2">
                    <div className="flex h-36 items-center justify-center overflow-hidden bg-surface-3">
                      {selected.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.url}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <FileText className="h-9 w-9 text-text-dim" />
                      )}
                    </div>
                    <p className="mt-2 truncate px-1 text-xs font-medium text-text">
                      {selected.filename}
                    </p>
                  </div>

                  {mode === "image" ? (
                    <>
                      <div>
                        <Label htmlFor="media-alt">Alternative text</Label>
                        <p className="mb-2 mt-1 text-[11px] leading-relaxed text-text-dim">
                          Describe what the image communicates for screen-reader users.
                        </p>
                        <Input
                          id="media-alt"
                          value={alt}
                          onChange={(event) => setAlt(event.target.value)}
                          placeholder="Describe this image"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="media-caption">Caption (optional)</Label>
                        <Input
                          id="media-caption"
                          value={caption}
                          onChange={(event) => setCaption(event.target.value)}
                          placeholder="Add context below the image"
                        />
                      </div>

                      <ChoiceStrip
                        label="Alignment"
                        value={alignment}
                        onChange={setAlignment}
                        options={[
                          { value: "left", label: "Left" },
                          { value: "center", label: "Center" },
                          { value: "right", label: "Right" },
                          { value: "wide", label: "Wide" },
                        ]}
                      />

                      <ChoiceStrip
                        label="Display size"
                        value={size}
                        onChange={setSize}
                        options={[
                          { value: "small", label: "S" },
                          { value: "medium", label: "M" },
                          { value: "large", label: "L" },
                          { value: "full", label: "Full" },
                        ]}
                      />
                    </>
                  ) : (
                    <>
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
                    </>
                  )}

                  {error && (
                    <p
                      role="alert"
                      className="border-l-4 border-vermilion bg-vermilion/5 px-3 py-2 text-xs leading-relaxed text-vermilion"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={insert}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 bg-text px-4 text-sm font-medium text-surface transition-colors hover:bg-cobalt disabled:opacity-50"
                  >
                    {mode === "image" ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {mode === "image" ? "Insert image" : "Insert attachment"}
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
