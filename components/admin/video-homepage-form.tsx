"use client";

import { useMemo, useState } from "react";
import { ChevronDown, GripVertical, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/admin/submit-button";
import { FormMessage } from "@/components/admin/form-message";
import { useMetadataAction } from "@/hooks/use-metadata-action";
import { updateVideoHomepageAction } from "@/app/admin/(dashboard)/video/actions";

interface VideoChoice {
  id: string;
  title: string;
  disciplines: string[];
}

interface HomepageValues {
  eyebrow: string;
  headline: string;
  intro: string;
  aboutHeading: string;
  aboutBody: string;
  videoEditingDescription: string;
  cinematographyDescription: string;
  heroVideoId: string | null;
  featuredVideoIds: string[];
}

export function VideoHomepageForm({ settings, videos }: { settings: HomepageValues; videos: VideoChoice[] }) {
  const { state, submit } = useMetadataAction(updateVideoHomepageAction, "cms:video:homepage");
  const [featured, setFeatured] = useState(settings.featuredVideoIds.filter((id) => videos.some((video) => video.id === id)).slice(0, 3));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const byId = useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);
  const available = videos.filter((video) => !featured.includes(video.id));

  function addFeatured(id: string) {
    if (featured.length >= 3) {
      setSelectionError("Featured work is limited to three published videos.");
      return;
    }
    setSelectionError(null);
    setFeatured((current) => [...current, id]);
  }

  function dropOn(targetId: string) {
    if (!draggedId || draggedId === targetId) return setDraggedId(null);
    setFeatured((current) => {
      const next = [...current];
      const from = next.indexOf(draggedId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedId(null);
  }

  return (
    <form action={submit} className="space-y-8">
      <section className="border border-border bg-surface p-5 sm:p-6">
        <p className="idx mb-3">01 / HERO</p>
        <div className="grid gap-4">
          <div><Label htmlFor="eyebrow">Eyebrow</Label><Input id="eyebrow" name="eyebrow" defaultValue={settings.eyebrow} required /></div>
          <div><Label htmlFor="headline">Headline</Label><Input id="headline" name="headline" defaultValue={settings.headline} required /></div>
          <div><Label htmlFor="intro">Introduction</Label><Textarea id="intro" name="intro" defaultValue={settings.intro} rows={4} required /></div>
          <div>
            <Label htmlFor="heroVideoId">Hero video</Label>
            <div className="admin-select-wrap">
              <select id="heroVideoId" name="heroVideoId" defaultValue={settings.heroVideoId ?? ""} className="flex h-10 w-full border border-border bg-surface px-3 text-sm text-text">
                <option value="">No hero video yet</option>
                {videos.map((video) => <option key={video.id} value={video.id}>{video.title}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <input type="hidden" name="aboutHeading" value={settings.aboutHeading} />
      <input type="hidden" name="aboutBody" value={settings.aboutBody} />

      <section className="border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="idx">02 / FEATURED WORK</p><p className="mt-2 text-sm text-text-dim">Up to three published projects. Drag selected rows to reorder them.</p></div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{featured.length} / 3</span>
        </div>
        <div className="space-y-2">
          {featured.map((id, index) => {
            const video = byId.get(id);
            if (!video) return null;
            return (
              <div
                key={id}
                draggable
                onDragStart={() => setDraggedId(id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(id)}
                className="flex items-center gap-3 border border-border bg-surface-2 px-3 py-3"
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" aria-hidden="true" />
                <span className="idx w-7 shrink-0">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-text">{video.title}</span>
                <button type="button" onClick={() => setFeatured((current) => current.filter((item) => item !== id))} className="flex h-8 w-8 items-center justify-center border border-border text-text-dim hover:text-text" aria-label={`Remove ${video.title} from featured work`}><X className="h-3.5 w-3.5" /></button>
                <input type="hidden" name="featuredVideoIds" value={id} />
              </div>
            );
          })}
          {!featured.length && <p className="border border-dashed border-border px-4 py-8 text-center text-sm text-text-dim">No featured videos selected yet.</p>}
        </div>
        {available.length > 0 && featured.length < 3 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="label mb-2">Available published videos</p>
            <div className="flex flex-wrap gap-2">
              {available.map((video) => <button key={video.id} type="button" onClick={() => addFeatured(video.id)} className="flex items-center gap-2 border border-border px-3 py-2 text-xs text-text-dim hover:border-border-strong hover:text-text"><Plus className="h-3 w-3" />{video.title}</button>)}
            </div>
          </div>
        )}
        {selectionError && <FormMessage variant="error" className="mt-4">{selectionError}</FormMessage>}
      </section>

      <section className="border border-border bg-surface p-5 sm:p-6">
        <p className="idx mb-3">03 / DISCIPLINES</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <div><p className="label mb-2">01 / VIDEO EDITING</p><Textarea name="videoEditingDescription" defaultValue={settings.videoEditingDescription} rows={5} required /></div>
          <div><p className="label mb-2">02 / CINEMATOGRAPHY</p><Textarea name="cinematographyDescription" defaultValue={settings.cinematographyDescription} rows={5} required /></div>
        </div>
      </section>

      {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}
      {!state.success && state.errors && <FormMessage variant="error">Fix the highlighted Video homepage fields and save again.</FormMessage>}
      <div className="flex justify-end"><SubmitButton pendingLabel="Saving homepage...">Save Video homepage</SubmitButton></div>
    </form>
  );
}
