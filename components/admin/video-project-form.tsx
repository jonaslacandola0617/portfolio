"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AdminCheckbox } from "@/components/admin/admin-checkbox";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormMessage } from "@/components/admin/form-message";
import { SegmentedStatusField } from "@/components/admin/segmented-status-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { VideoYouTubeField } from "@/components/admin/video-youtube-field";
import { EditorShell } from "@/components/editor/editor-shell";
import { useMetadataAction } from "@/hooks/use-metadata-action";
import { slugify } from "@/lib/utils";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import { autosaveVideoContentAction, createVideoProjectAction, deleteVideoProjectAction, updateVideoProjectAction } from "@/app/admin/(dashboard)/video/actions";

const publishStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="admin-field-error">{errors[0]}</p>;
}

export interface VideoProjectEditorData {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: JSONContent;
  youtubeUrl: string;
  disciplines: string[];
  roles: string[];
  tools: string[];
  client: string;
  runtime: string;
  customPosterId: string;
  completionDate: string;
  publishStatus: string;
  scheduledFor: string;
}

export function VideoProjectForm({ project, media }: { project: VideoProjectEditorData; media: AdminMediaItem[] }) {
  const router = useRouter();
  const isNew = !project.id;
  const projectId = project.id;
  const metadataAction = project.id ? updateVideoProjectAction.bind(null, project.id) : createVideoProjectAction;
  const { state, submit, isPending } = useMetadataAction(metadataAction, project.id ? `cms:video:${project.id}:metadata` : "cms:video:new:metadata");
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(project.slug));
  const [publishStatus, setPublishStatus] = useState(project.publishStatus);
  const [showCaseStudy, setShowCaseStudy] = useState(false);
  const imageMedia = media.filter((item) => item.type === "IMAGE");

  useEffect(() => {
    if (isNew && state.success && state.recordId) {
      router.replace(`/admin/video/projects/${state.recordId}`);
    }
  }, [isNew, router, state.recordId, state.success]);

  return (
    <div className="admin-control-settings !max-w-none !p-0">
      <form action={submit} className="admin-control-settings-form">
        <section className="admin-form-section">
          <header>
            <span>01</span>
            <div>
              <h2>Identity</h2>
              <p>The title, URL, and concise public introduction.</p>
            </div>
          </header>
          <div className="admin-form-section-body">
            <div className="admin-form-grid">
              <div className="admin-field">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTitle(next);
                    if (!slugTouched) setSlug(slugify(next));
                  }}
                  required
                />
                <FieldError errors={state.errors?.title} />
              </div>
              <div className="admin-field">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugTouched(true);
                  }}
                  required
                />
                <FieldError errors={state.errors?.slug} />
              </div>
              <div className="admin-field is-full">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" name="summary" defaultValue={project.summary} rows={4} />
                <p className="admin-field-note">Required before publishing.</p>
                <FieldError errors={state.errors?.summary} />
              </div>
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <header>
            <span>02</span>
            <div>
              <h2>Video source</h2>
              <p>YouTube hosts playback; this portfolio loads it only after Play.</p>
            </div>
          </header>
          <div className="admin-form-section-body">
            <div className="admin-field">
              <VideoYouTubeField defaultValue={project.youtubeUrl} error={state.errors?.youtubeUrl?.[0]} />
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <header>
            <span>03</span>
            <div>
              <h2>Disciplines</h2>
              <p>Select Video Editing, Cinematography, or both.</p>
            </div>
          </header>
          <div className="admin-form-section-body">
            <fieldset className="space-y-3">
              <legend className="sr-only">Disciplines</legend>
              <label className="flex items-center gap-3 border border-border px-3 py-3 text-sm text-text">
                <AdminCheckbox name="disciplines" value="VIDEO_EDITING" defaultChecked={project.disciplines.includes("VIDEO_EDITING")} />
                <span>
                  <strong className="font-medium">01 / Video Editing</strong>
                  <span className="mt-0.5 block text-xs text-text-dim">Story structure, pacing, sequencing, sound, and rhythm.</span>
                </span>
              </label>
              <label className="flex items-center gap-3 border border-border px-3 py-3 text-sm text-text">
                <AdminCheckbox name="disciplines" value="CINEMATOGRAPHY" defaultChecked={project.disciplines.includes("CINEMATOGRAPHY")} />
                <span>
                  <strong className="font-medium">02 / Cinematography</strong>
                  <span className="mt-0.5 block text-xs text-text-dim">Composition, framing, movement, and intentional imagery.</span>
                </span>
              </label>
              <FieldError errors={state.errors?.disciplines} />
            </fieldset>
          </div>
        </section>

        <section className="admin-form-section">
          <header>
            <span>04</span>
            <div>
              <h2>Production</h2>
              <p>Optional credits and practical project details.</p>
            </div>
          </header>
          <div className="admin-form-section-body">
            <div className="admin-form-grid">
              <div className="admin-field">
                <Label htmlFor="roles">My roles</Label>
                <Input id="roles" name="roles" defaultValue={project.roles.join(", ")} placeholder="Editor, Camera Operator" />
                <p className="admin-field-note">Separate multiple roles with commas.</p>
              </div>
              <div className="admin-field">
                <Label htmlFor="tools">Tools</Label>
                <Input id="tools" name="tools" defaultValue={project.tools.join(", ")} placeholder="DaVinci Resolve, Premiere Pro" />
                <p className="admin-field-note">Separate multiple tools with commas.</p>
              </div>
              <div className="admin-field">
                <Label htmlFor="client">Client / organization</Label>
                <Input id="client" name="client" defaultValue={project.client} />
              </div>
              <div className="admin-field">
                <Label htmlFor="runtime">Runtime</Label>
                <Input id="runtime" name="runtime" defaultValue={project.runtime} placeholder="03:42" />
              </div>
              <div className="admin-field">
                <Label htmlFor="completionDate">Completion date</Label>
                <Input id="completionDate" name="completionDate" type="date" defaultValue={project.completionDate} />
                <FieldError errors={state.errors?.completionDate} />
              </div>
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <header>
            <span>05</span>
            <div>
              <h2>Poster</h2>
              <p>Optional override for the generated YouTube thumbnail.</p>
            </div>
          </header>
          <div className="admin-form-section-body">
            <div className="admin-field">
              <Label htmlFor="customPosterId">Media Library image</Label>
              <select id="customPosterId" name="customPosterId" defaultValue={project.customPosterId}>
                <option value="">Use YouTube thumbnail</option>
                {imageMedia.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.filename}
                  </option>
                ))}
              </select>
              <p className="admin-field-note">Upload new poster images through Media, then select one here.</p>
              <FieldError errors={state.errors?.customPosterId} />
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <header>
            <span>06</span>
            <div>
              <h2>Publishing</h2>
              <p>Drafts may be incomplete. Published work must be safe to render.</p>
            </div>
          </header>
          <div className="admin-form-section-body space-y-5">
            <input type="hidden" name="scheduledFor" value={project.scheduledFor} />
            <SegmentedStatusField name="publishStatus" label="Publish status" value={publishStatus} onValueChange={setPublishStatus} options={publishStatusOptions} description="Publishing requires a summary, valid YouTube URL, and at least one discipline." />
            {!isNew ? (
              <div className="border border-vermilion/30 p-4">
                <p className="label mb-1 text-vermilion">Danger zone</p>
                <p className="text-xs text-text-dim">Deleting this project removes only its admin record and homepage references—not its YouTube video or Media Library poster.</p>
              </div>
            ) : null}
          </div>
        </section>

        {!state.success && state.message ? <FormMessage variant="error">{state.message}</FormMessage> : null}
        {!state.success && state.errors ? <FormMessage variant="error">Fix the highlighted Video metadata fields, then save again.</FormMessage> : null}
        <div className="admin-form-actions">
          <Link href="/admin/video/projects" className="border-b border-border-strong pb-1 text-xs text-text-dim hover:text-text">
            Cancel
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            {!isNew && projectId ? <DeleteButton label="Delete video" contentType="video project" recordTitle={project.title} onDelete={() => deleteVideoProjectAction(projectId)} onSuccess={() => router.replace("/admin/video/projects")} /> : null}
            <SubmitButton pendingLabel={isNew ? "Creating project…" : "Saving changes…"} forcePending={isPending}>
              {isNew ? "Create project" : "Save metadata"}
            </SubmitButton>
          </div>
        </div>
      </form>

      {!isNew && projectId ? (
        <section className="mt-12 max-w-[980px] border-t border-border-strong pt-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex gap-4">
              <BookOpen className="mt-1 h-5 w-5 shrink-0 text-cobalt" aria-hidden="true" />
              <div>
                <p className="font-display text-2xl text-text">Optional case study</p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-text-dim">Add a step-by-step process, creative approach, technical notes, or credits only when this project needs more context.</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowCaseStudy((current) => !current)} aria-expanded={showCaseStudy} className="inline-flex shrink-0 items-center justify-center gap-2 border border-border-strong px-4 py-2.5 text-xs font-medium text-text">
              {showCaseStudy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showCaseStudy ? "Close editor" : "Add or edit case study"}
            </button>
          </div>
          {showCaseStudy ? (
            <div className="mt-6 h-[70dvh] min-h-[520px] overflow-hidden border border-border sm:h-[min(780px,calc(100dvh-120px))] sm:min-h-[620px]">
              <EditorShell initialContent={project.content} recordId={projectId} contentType="video" onSave={autosaveVideoContentAction} media={media} documentTitle={title} standalone />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
