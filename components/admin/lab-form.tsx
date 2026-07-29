"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EditorShell } from "@/components/editor/editor-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { FormMessage } from "@/components/admin/form-message";
import { DeleteButton } from "@/components/admin/delete-button";
import { slugify } from "@/lib/utils";
import { useEditorFormCoordination } from "@/hooks/use-editor-form-coordination";
import { useMetadataAction } from "@/hooks/use-metadata-action";
import {
  TaxonomyCombobox,
  TaxonomyMultiCombobox,
} from "@/components/admin/taxonomy-combobox";
import { TemplateSelector } from "@/components/admin/template-selector";
import { labTemplates } from "@/lib/editor/templates";
import { AuthoringWorkspace } from "@/components/admin/authoring-workspace";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import { LabResourcesEditor } from "@/components/admin/lab-resources-editor";
import {
  createLabAction,
  updateLabAction,
  autosaveLabContentAction,
  deleteLabAction,
} from "@/app/admin/(dashboard)/labs/actions";

interface LabFormProps {
  mode: "create" | "edit";
  media?: AdminMediaItem[];
  lab?: {
    id: string;
    title: string;
    slug: string;
    purpose: string;
    category: string;
    difficulty: string;
    progressStatus: string;
    publishStatus: string;
    tags: string[];
    labDate: string;
    scheduledFor: string;
    content: JSONContent;
    downloads: Array<{ mediaId: string; label: string; description: string }>;
  };
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function LabForm({ mode, lab, media = [] }: LabFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = mode === "edit" && searchParams.get("created") === "1";

  const action =
    mode === "create" ? createLabAction : updateLabAction.bind(null, lab!.id);
  const { state, submit: formAction } = useMetadataAction(
    action,
    mode === "edit" ? `cms:lab:${lab!.id}:metadata` : undefined,
  );
  const [title, setTitle] = useState(lab?.title ?? "");
  const [slug, setSlug] = useState(lab?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(
    lab?.publishStatus ?? "DRAFT",
  );
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);

  return (
    <AuthoringWorkspace
      enabled={mode === "edit"}
      storageKey="cms:lab:inspector"
      contentLabel="lab"
    >
      <form
        onSubmit={editorForm.onSubmit}
        className={
          mode === "edit"
            ? "grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]"
            : "space-y-6"
        }
      >
        {justCreated && (
          <QuerySuccessToast
            messages={{ created: "Lab created — autosave is on below." }}
          />
        )}

        <div
          className={
            mode === "edit"
              ? "min-h-0 space-y-6 overflow-y-auto px-6 py-3 scrollbar-thin"
              : "space-y-6"
          }
        >
        <Card
          className={mode === "edit" ? "border-0 bg-transparent" : undefined}
        >
          <CardContent
            className={mode === "edit" ? "space-y-5 p-0" : "space-y-5 pt-6"}
          >
            <div
              className={
                mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"
              }
            >
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  required
                />
                <FieldError errors={state.errors?.title} />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  required
                />
                <FieldError errors={state.errors?.slug} />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                name="purpose"
                defaultValue={lab?.purpose}
                required
              />
              <FieldError errors={state.errors?.purpose} />
            </div>

            <div
              className={
                mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-3"
              }
            >
              <div>
                <Label htmlFor="category">Category</Label>
                <TaxonomyCombobox
                  name="category"
                  kind="category"
                  label="Category"
                  defaultValue={lab?.category}
                  required
                />
                <FieldError errors={state.errors?.category} />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={lab?.difficulty ?? "INTERMEDIATE"}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <Label htmlFor="progressStatus">Real-world status</Label>
                <select
                  id="progressStatus"
                  name="progressStatus"
                  defaultValue={lab?.progressStatus ?? "PLANNED"}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div
              className={
                mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"
              }
            >
              <div>
                <Label>Tags</Label>
                <TaxonomyMultiCombobox
                  name="tags"
                  kind="tag"
                  label="Tags"
                  defaultValues={lab?.tags}
                />
              </div>
              <div>
                <Label htmlFor="labDate">Lab date</Label>
                <Input
                  id="labDate"
                  name="labDate"
                  type="date"
                  defaultValue={lab?.labDate}
                  required
                />
                <FieldError errors={state.errors?.labDate} />
              </div>
            </div>

            <div
              className={
                mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"
              }
            >
              <div>
                <Label htmlFor="publishStatus">Publish status</Label>
                <select
                  id="publishStatus"
                  name="publishStatus"
                  value={publishStatus}
                  onChange={(e) => setPublishStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Publish manually when the lab is ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {mode === "create" && <TemplateSelector templates={labTemplates} />}
        {mode === "edit" && lab && (
          <LabResourcesEditor
            labId={lab.id}
            media={media}
            initialResources={lab.downloads}
          />
        )}
        </div>

        <div
          className={
            mode === "edit"
              ? "space-y-2 bg-card px-6 py-4"
              : "space-y-3 rounded-lg border border-border bg-card p-4"
          }
        >
          {editorForm.coordinationError && (
            <FormMessage variant="error">
              {editorForm.coordinationError}
            </FormMessage>
          )}
          {!state.success && state.message && (
            <FormMessage variant="error">{state.message}</FormMessage>
          )}
          {!state.success && state.errors && (
            <FormMessage variant="error">
              Fix the highlighted metadata fields, then save again.
            </FormMessage>
          )}
          <div
            className={
              mode === "edit"
                ? "grid gap-2"
                : "flex items-center justify-between"
            }
          >
            <SubmitButton
              pendingLabel={
                mode === "create" ? "Creating..." : "Saving changes..."
              }
              forcePending={editorForm.isCoordinating}
              className={mode === "edit" ? "w-full" : undefined}
            >
              {mode === "create" ? "Create lab" : "Save changes"}
            </SubmitButton>
            {mode === "edit" && lab && (
              <DeleteButton
                contentType="lab"
                recordTitle={lab.title}
                onDelete={() => deleteLabAction(lab.id)}
                onSuccess={() => router.push("/admin/labs")}
                className="w-full justify-center"
              />
            )}
          </div>
        </div>
      </form>

      {mode === "edit" && lab && (
        <div className="h-full min-h-0">
          <EditorShell
            initialContent={lab.content}
            recordId={lab.id}
            contentType="lab"
            onSave={autosaveLabContentAction}
            onReady={editorForm.registerEditor}
            media={media}
          />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">
          Save the lab first — the content editor opens once it has an id to
          autosave against.
        </p>
      )}
    </AuthoringWorkspace>
  );
}
