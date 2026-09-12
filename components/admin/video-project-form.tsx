"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AdminCheckbox } from "@/components/admin/admin-checkbox";
import { AuthoringWorkspace } from "@/components/admin/authoring-workspace";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormMessage } from "@/components/admin/form-message";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import { SegmentedStatusField } from "@/components/admin/segmented-status-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { VideoYouTubeField } from "@/components/admin/video-youtube-field";
import { EditorShell } from "@/components/editor/editor-shell";
import { useEditorFormCoordination } from "@/hooks/use-editor-form-coordination";
import { useMetadataAction } from "@/hooks/use-metadata-action";
import { slugify } from "@/lib/utils";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import {
  autosaveVideoContentAction,
  deleteVideoProjectAction,
  updateVideoProjectAction,
} from "@/app/admin/(dashboard)/video/actions";

const publishStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export interface VideoProjectEditorData {
  id: string;
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
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const action = updateVideoProjectAction.bind(null, project.id);
  const { state, submit: formAction } = useMetadataAction(action, `cms:video:${project.id}:metadata`);
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(!project.slug.startsWith("untitled-video-"));
  const [publishStatus, setPublishStatus] = useState(project.publishStatus);
  const editorForm = useEditorFormCoordination(true, formAction);
  const imageMedia = media.filter((item) => item.type === "IMAGE");

  return (
    <AuthoringWorkspace enabled contentLabel="video project" title={title} backHref="/admin/video/projects">
      <form
        data-bauhaus-metadata-sheet="true"
        onSubmit={editorForm.onSubmit}
        className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]"
      >
        {justCreated && <QuerySuccessToast messages={{ created: "Video draft created — autosave is on below." }} />}
        <div data-admin-metadata-scroll="true" className="min-h-0 space-y-6 overflow-y-auto px-5 py-5 scrollbar-thin">
          <Card className="border-0 bg-transparent">
            <CardContent className="space-y-6 p-0">
              <div className="grid gap-4">
                <div>
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
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setSlugTouched(true); }} required />
                  <FieldError errors={state.errors?.slug} />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" name="summary" defaultValue={project.summary} rows={4} />
                <FieldError errors={state.errors?.summary} />
              </div>

              <VideoYouTubeField defaultValue={project.youtubeUrl} error={state.errors?.youtubeUrl?.[0]} />

              <fieldset className="space-y-3">
                <legend className="label">Disciplines</legend>
                <label className="flex items-center gap-3 border border-border bg-surface-2 px-3 py-3 text-sm text-text">
                  <AdminCheckbox name="disciplines" value="VIDEO_EDITING" defaultChecked={project.disciplines.includes("VIDEO_EDITING")} />
                  <span><strong className="font-medium">01 / Video Editing</strong><span className="mt-0.5 block text-xs text-text-dim">Story structure, pacing, sequencing, sound, and rhythm.</span></span>
                </label>
                <label className="flex items-center gap-3 border border-border bg-surface-2 px-3 py-3 text-sm text-text">
                  <AdminCheckbox name="disciplines" value="CINEMATOGRAPHY" defaultChecked={project.disciplines.includes("CINEMATOGRAPHY")} />
                  <span><strong className="font-medium">02 / Cinematography</strong><span className="mt-0.5 block text-xs text-text-dim">Composition, framing, movement, and intentional imagery.</span></span>
                </label>
                <FieldError errors={state.errors?.disciplines} />
              </fieldset>

              <div className="grid gap-4">
                <div><Label htmlFor="roles">My roles (comma-separated)</Label><Input id="roles" name="roles" defaultValue={project.roles.join(", ")} placeholder="Editor, Camera Operator" /></div>
                <div><Label htmlFor="tools">Tools (comma-separated)</Label><Input id="tools" name="tools" defaultValue={project.tools.join(", ")} placeholder="DaVinci Resolve, Premiere Pro" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="client">Client / organization</Label><Input id="client" name="client" defaultValue={project.client} /></div>
                <div><Label htmlFor="runtime">Runtime</Label><Input id="runtime" name="runtime" defaultValue={project.runtime} placeholder="03:42" /></div>
                <div><Label htmlFor="completionDate">Completion date</Label><Input id="completionDate" name="completionDate" type="date" defaultValue={project.completionDate} /></div>
                <div>
                  <Label htmlFor="customPosterId">Custom poster</Label>
                  <select id="customPosterId" name="customPosterId" defaultValue={project.customPosterId} className="flex h-10 w-full border border-border bg-surface px-3 text-sm text-text">
                    <option value="">Use YouTube thumbnail</option>
                    {imageMedia.map((item) => <option key={item.id} value={item.id}>{item.filename}</option>)}
                  </select>
                  <p className="mt-1 text-[11px] text-text-dim">Upload additional poster images through the existing Media Library.</p>
                </div>
              </div>

              <input type="hidden" name="scheduledFor" value={project.scheduledFor} />
              <SegmentedStatusField
                name="publishStatus"
                label="Publish status"
                value={publishStatus}
                onValueChange={setPublishStatus}
                options={publishStatusOptions}
                description="Publishing requires a summary, valid YouTube URL, and at least one discipline."
              />
            </CardContent>
          </Card>

          <div className="border border-vermilion/30 bg-vermilion/5 p-4">
            <p className="label mb-1 text-vermilion">Danger Zone</p>
            <p className="text-xs text-text-dim">Deleting this record removes it from the Video portfolio and homepage selections, but never deletes the YouTube video or Media Library poster.</p>
          </div>
        </div>

        <div data-admin-metadata-actions="true" className="sticky bottom-0 space-y-2 border-t border-border bg-surface-2 px-5 py-4">
          {editorForm.coordinationError && <FormMessage variant="error">{editorForm.coordinationError}</FormMessage>}
          {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}
          {!state.success && state.errors && <FormMessage variant="error">Fix the highlighted Video metadata fields, then save again.</FormMessage>}
          <div className="flex items-center justify-between gap-2">
            <DeleteButton
              variant="sheet"
              label="Delete this video"
              contentType="video project"
              recordTitle={project.title}
              onDelete={() => deleteVideoProjectAction(project.id)}
              onSuccess={() => router.push("/admin/video/projects")}
              className="order-1 justify-center"
            />
            <SubmitButton pendingLabel="Saving changes..." forcePending={editorForm.isCoordinating} className="order-2">Save changes</SubmitButton>
          </div>
        </div>
      </form>

      <div className="h-full min-h-0">
        <EditorShell
          initialContent={project.content}
          recordId={project.id}
          contentType={"video" as "project"}
          onSave={autosaveVideoContentAction}
          onReady={editorForm.registerEditor}
          media={media}
          documentTitle={title}
        />
      </div>
    </AuthoringWorkspace>
  );
}
