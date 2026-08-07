"use client";

import { useMemo, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { updateLabResourcesAction } from "@/app/admin/(dashboard)/labs/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMediaRecordAction, type AdminMediaItem } from "@/lib/services/media-admin-service";
import { guessMediaType } from "@/lib/validations/media";
import { useToast } from "@/components/ui/toast";

interface Resource {
  mediaId: string;
  label: string;
  description: string;
}

export function LabResourcesEditor({
  labId,
  media,
  initialResources,
}: {
  labId: string;
  media: AdminMediaItem[];
  initialResources: Resource[];
}) {
  const [mediaItems, setMediaItems] = useState(media);
  const available = useMemo(() => mediaItems.filter((item) => item.type !== "IMAGE"), [mediaItems]);
  const [resources, setResources] = useState(initialResources);
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const { success } = useToast();

  const add = () => {
    const item = available.find((candidate) => candidate.id === selectedId);
    if (!item || resources.some((resource) => resource.mediaId === item.id)) return;
    setResources((current) => [...current, { mediaId: item.id, label: item.filename, description: "" }]);
    setMessage(null);
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= resources.length) return;
    setResources((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const save = () => startTransition(async () => {
    const result = await updateLabResourcesAction({
      labId,
      resources: resources.map((resource, sortOrder) => ({ ...resource, sortOrder })),
    });
    if (result.success) {
      setMessage(null);
      success(result.message ?? "Resources saved.", {
        id: `lab-resources:${labId}`,
      });
    } else {
      setMessage({ success: false, text: result.message ?? "Resources could not be saved." });
    }
  });
  const uploadResource = async (file: File) => {
    setUploading(true);
    setMessage(null);
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
      setMediaItems((current) => [created, ...current]);
      setSelectedId(created.id);
      setResources((current) => [
        ...current,
        { mediaId: created.id, label: created.filename, description: "" },
      ]);
      success("Resource uploaded and added.", {
        id: `lab-resource-upload:${created.id}`,
      });
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : "Resource upload failed.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <p className="label mb-2">Resources</p>
        <p className="text-xs text-text-dim">
          Attach downloadable files to this lab. Removing an association does not delete the Media Library file.
        </p>
      </div>

      <div className="flex gap-2">
        <select
          aria-label="Media Library resource"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="h-10 min-w-0 flex-1 border border-border bg-surface px-3 text-sm text-text outline-none focus:border-cobalt"
        >
          {available.map((item) => (
            <option key={item.id} value={item.id}>{item.filename}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!selectedId}
          className="inline-flex h-10 items-center gap-1.5 border border-border px-3 text-sm text-text-dim hover:border-border-strong hover:text-text disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      <label className="flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-border px-3 py-2 text-xs text-muted hover:border-border-strong hover:text-text-dim">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
        {uploading ? "Uploading…" : "+ Upload and add resource"}
        <input
          type="file"
          hidden
          disabled={uploading}
          onChange={(event) => event.target.files?.[0] && void uploadResource(event.target.files[0])}
        />
      </label>

      <div className="space-y-2">
        {resources.map((resource, index) => {
          const item = available.find((candidate) => candidate.id === resource.mediaId);
          return (
            <div key={resource.mediaId} className="border border-border bg-surface px-3 py-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs text-text-dim">{item?.filename ?? resource.mediaId}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" aria-label="Move resource up" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-muted hover:text-text disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label="Move resource down" onClick={() => move(index, 1)} disabled={index === resources.length - 1} className="p-1 text-muted hover:text-text disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label="Remove resource association" onClick={() => setResources((current) => current.filter((_, entryIndex) => entryIndex !== index))} className="p-1 text-vermilion"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`resource-label-${index}`}>Display name</Label>
                  <Input id={`resource-label-${index}`} value={resource.label} onChange={(event) => setResources((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} />
                </div>
                <div>
                  <Label htmlFor={`resource-description-${index}`}>Description</Label>
                  <Input id={`resource-description-${index}`} value={resource.description} onChange={(event) => setResources((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: event.target.value } : entry))} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {message && <p role="alert" className="text-xs text-vermilion">{message.text}</p>}
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="inline-flex items-center gap-2 border border-border-strong bg-text px-3 py-2 text-sm font-medium text-surface disabled:opacity-50"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Saving resources…" : "Save resources"}
      </button>
    </section>
  );
}
