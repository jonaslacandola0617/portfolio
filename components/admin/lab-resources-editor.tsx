"use client";

import { useMemo, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { updateLabResourcesAction } from "@/app/admin/(dashboard)/labs/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMediaRecordAction, type AdminMediaItem } from "@/lib/services/media-admin-service";
import { guessMediaType } from "@/lib/validations/media";

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
    setMessage({ success: result.success, text: result.message ?? (result.success ? "Resources saved." : "Resources could not be saved.") });
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
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">Downloads and resources</h3>
        <p className="mt-1 text-xs text-muted-foreground">Associations are removed independently; Media Library files are never deleted here.</p>
      </div>
      <div className="flex gap-2">
        <select aria-label="Media Library resource" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm">
          {available.map((item) => <option key={item.id} value={item.id}>{item.filename}</option>)}
        </select>
        <button type="button" onClick={add} disabled={!selectedId} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-accent disabled:opacity-50"><Plus className="h-4 w-4" />Add</button>
      </div>
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-accent">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {uploading ? "Uploading…" : "Upload and add resource"}
        <input
          type="file"
          hidden
          disabled={uploading}
          onChange={(event) => event.target.files?.[0] && void uploadResource(event.target.files[0])}
        />
      </label>
      {resources.map((resource, index) => {
        const item = available.find((candidate) => candidate.id === resource.mediaId);
        return (
          <div key={resource.mediaId} className="space-y-2 rounded-md border border-border bg-background p-3">
            <p className="truncate font-mono text-[0.65rem] text-muted-foreground">{item?.filename ?? resource.mediaId}</p>
            <div><Label htmlFor={`resource-label-${index}`}>Display name</Label><Input id={`resource-label-${index}`} value={resource.label} onChange={(event) => setResources((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} /></div>
            <div><Label htmlFor={`resource-description-${index}`}>Description</Label><Input id={`resource-description-${index}`} value={resource.description} onChange={(event) => setResources((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: event.target.value } : entry))} /></div>
            <div className="flex justify-end gap-1">
              <button type="button" aria-label="Move resource up" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" aria-label="Move resource down" onClick={() => move(index, 1)} disabled={index === resources.length - 1} className="rounded p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              <button type="button" aria-label="Remove resource association" onClick={() => setResources((current) => current.filter((_, entryIndex) => entryIndex !== index))} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        );
      })}
      {message && <p role="status" className={message.success ? "text-xs text-success" : "text-xs text-destructive"}>{message.text}</p>}
      <button type="button" onClick={save} disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Saving resources…" : "Save resources"}</button>
    </section>
  );
}
