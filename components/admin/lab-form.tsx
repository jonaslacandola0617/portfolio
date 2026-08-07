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
import { SegmentedStatusField } from "@/components/admin/segmented-status-field";
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
  templateId?: string;
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

const realWorldStatusOptions = [
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

const publishStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function LabForm({ mode, lab, media = [], templateId }: LabFormProps) {
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
  const [slugTouched, setSlugTouched] = useState(false);
  const [publishStatus, setPublishStatus] = useState(
    lab?.publishStatus ?? "DRAFT",
  );
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);

  return (
    <AuthoringWorkspace
      enabled={mode === "edit"}
      storageKey="cms:lab:inspector"
      contentLabel="lab"
      title={title}
      backHref="/admin/labs"
    >
      <form
        data-bauhaus-metadata-sheet={mode === "edit" ? "true" : undefined}
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
              ? "min-h-0 space-y-6 overflow-y-auto px-5 py-5 scrollbar-thin"
              : "space-y-6"
          }
        >
          <Card
            className={mode === "edit" ? "border-0 bg-transparent" : undefined}
          >
            <CardContent
              className={mode === "edit" ? "space-y-6 p-0" : "space-y-5 pt-6"}
            >
              <SegmentedStatusField
                name="progressStatus"
                label="Real-world status"
                defaultValue={lab?.progressStatus ?? "PLANNED"}
                options={realWorldStatusOptions}
              />

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
                  mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"
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
                    className="flex h-10 w-full border border-border bg-surface px-3 text-sm"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
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

              <SegmentedStatusField
                name="publishStatus"
                label="Publish status"
                value={publishStatus}
                onValueChange={setPublishStatus}
                options={publishStatusOptions}
                description="Publish manually when the lab is ready."
              />
            </CardContent>
          </Card>

          {mode === "create" && !templateId && (
            <TemplateSelector templates={labTemplates} />
          )}
          {mode === "create" && templateId && (
            <input type="hidden" name="templateId" value={templateId} />
          )}
          {mode === "edit" && lab && (
            <LabResourcesEditor
              labId={lab.id}
              media={media}
              initialResources={lab.downloads}
            />
          )}

          {mode === "edit" && (
            <div className="border border-vermilion/30 bg-vermilion/5 p-4">
              <p className="label mb-1 text-vermilion">Danger Zone</p>
              <p className="text-xs text-text-dim">
                Deleting this lab removes it from the public site immediately.
              </p>
            </div>
          )}
        </div>

        <div
          className={
            mode === "edit"
              ? "sticky bottom-0 space-y-2 border-t border-border bg-surface-2 px-5 py-4"
              : "space-y-3 border border-border bg-surface-2 p-4"
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
                ? "flex items-center justify-between gap-2"
                : "flex items-center justify-between"
            }
          >
            <SubmitButton
              pendingLabel={mode === "create" ? "Creating..." : "Saving changes..."}
              forcePending={editorForm.isCoordinating}
              className={mode === "edit" ? "order-2" : undefined}
            >
              {mode === "create" ? "Create lab" : "Save changes"}
            </SubmitButton>
            {mode === "edit" && lab && (
              <DeleteButton
                variant="sheet"
                label="Delete"
                contentType="lab"
                recordTitle={lab.title}
                onDelete={() => deleteLabAction(lab.id)}
                onSuccess={() => router.push("/admin/labs")}
                className="order-1 justify-center"
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
            documentTitle={title}
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
