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
import { projectTemplates } from "@/lib/editor/templates";
import { AuthoringWorkspace } from "@/components/admin/authoring-workspace";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import {
  createProjectAction,
  updateProjectAction,
  autosaveProjectContentAction,
  deleteProjectAction,
} from "@/app/admin/(dashboard)/projects/actions";

interface ProjectFormProps {
  mode: "create" | "edit";
  media?: AdminMediaItem[];
  templateId?: string;
  project?: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    difficulty: string;
    progressStatus: string;
    publishStatus: string;
    tags: string[];
    skills: string[];
    technologies: string[];
    estimatedTime: string;
    completionDate: string;
    githubUrl: string;
    liveSiteUrl: string;
    demoUrl: string;
    scheduledFor: string;
    content: JSONContent;
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

function isWebDevelopmentCategory(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase() === "web development";
}

export function ProjectForm({
  mode,
  project,
  media = [],
  templateId,
}: ProjectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = mode === "edit" && searchParams.get("created") === "1";

  const action =
    mode === "create"
      ? createProjectAction
      : updateProjectAction.bind(null, project!.id);
  const { state, submit: formAction } = useMetadataAction(
    action,
    mode === "edit" ? `cms:project:${project!.id}:metadata` : undefined,
  );
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState(project?.category ?? "");
  const [publishStatus, setPublishStatus] = useState(
    project?.publishStatus ?? "DRAFT",
  );
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);
  const isWebDevelopment = isWebDevelopmentCategory(category);

  return (
    <AuthoringWorkspace
      enabled={mode === "edit"}
      storageKey="cms:project:inspector"
      contentLabel="project"
      title={title}
      backHref="/admin/projects"
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
            messages={{ created: "Project created — autosave is on below." }}
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
                defaultValue={project?.progressStatus ?? "PLANNED"}
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
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  defaultValue={project?.summary}
                  required
                />
                <FieldError errors={state.errors?.summary} />
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
                    defaultValue={project?.category}
                    onValueChange={setCategory}
                    required
                  />
                  <FieldError errors={state.errors?.category} />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    defaultValue={project?.difficulty ?? "INTERMEDIATE"}
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
                  mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-3"
                }
              >
                <div>
                  <Label>Tags</Label>
                  <TaxonomyMultiCombobox
                    name="tags"
                    kind="tag"
                    label="Tags"
                    defaultValues={project?.tags}
                  />
                </div>
                <div>
                  <Label>Skills</Label>
                  <TaxonomyMultiCombobox
                    name="skills"
                    kind="skill"
                    label="Skills"
                    defaultValues={project?.skills}
                  />
                </div>
                <div>
                  <Label htmlFor="technologies">
                    Technologies (comma-separated)
                  </Label>
                  <Input
                    id="technologies"
                    name="technologies"
                    defaultValue={project?.technologies.join(", ")}
                  />
                </div>
              </div>

              <div
                className={
                  mode === "edit"
                    ? "grid grid-cols-2 gap-4"
                    : "grid gap-4 sm:grid-cols-3"
                }
              >
                <div>
                  <Label htmlFor="estimatedTime">Estimated time</Label>
                  <Input
                    id="estimatedTime"
                    name="estimatedTime"
                    defaultValue={project?.estimatedTime}
                    placeholder="4-5 hours"
                  />
                </div>
                <div>
                  <Label htmlFor="completionDate">Completion date</Label>
                  <Input
                    id="completionDate"
                    name="completionDate"
                    type="date"
                    defaultValue={project?.completionDate}
                    required
                  />
                  <FieldError errors={state.errors?.completionDate} />
                </div>
                <div className={mode === "edit" ? "col-span-2" : undefined}>
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    defaultValue={project?.githubUrl}
                  />
                  <FieldError errors={state.errors?.githubUrl} />
                </div>
              </div>

              {isWebDevelopment && (
                <div className="border border-cobalt/30 bg-cobalt/5 p-4">
                  <div className="mb-4">
                    <p className="label text-cobalt">Web Project Links</p>
                    <p className="mt-1 text-xs leading-5 text-text-dim">
                      These links appear prominently in the public project sidebar for employers.
                    </p>
                  </div>
                  <div className={mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
                    <div>
                      <Label htmlFor="liveSiteUrl">Live Site URL</Label>
                      <Input
                        id="liveSiteUrl"
                        name="liveSiteUrl"
                        type="url"
                        placeholder="https://example.com"
                        defaultValue={project?.liveSiteUrl}
                      />
                      <FieldError errors={state.errors?.liveSiteUrl} />
                    </div>
                    <div>
                      <Label htmlFor="demoUrl">Demo URL</Label>
                      <Input
                        id="demoUrl"
                        name="demoUrl"
                        type="url"
                        placeholder="https://..."
                        defaultValue={project?.demoUrl}
                      />
                      <FieldError errors={state.errors?.demoUrl} />
                    </div>
                  </div>
                </div>
              )}

              <SegmentedStatusField
                name="publishStatus"
                label="Publish status"
                value={publishStatus}
                onValueChange={setPublishStatus}
                options={publishStatusOptions}
                description="Publish manually when the project is ready."
              />
            </CardContent>
          </Card>

          {mode === "create" && !templateId && (
            <TemplateSelector templates={projectTemplates} />
          )}
          {mode === "create" && templateId && (
            <input type="hidden" name="templateId" value={templateId} />
          )}

          {mode === "edit" && (
            <div className="border border-vermilion/30 bg-vermilion/5 p-4">
              <p className="label mb-1 text-vermilion">Danger Zone</p>
              <p className="text-xs text-text-dim">
                Deleting this project removes it from the public site immediately.
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
              pendingLabel={
                mode === "create" ? "Creating..." : "Saving changes..."
              }
              forcePending={editorForm.isCoordinating}
              className={mode === "edit" ? "order-2" : undefined}
            >
              {mode === "create" ? "Create project" : "Save changes"}
            </SubmitButton>
            {mode === "edit" && project && (
              <DeleteButton
                variant="sheet"
                label="Delete this project"
                contentType="project"
                recordTitle={project.title}
                onDelete={() => deleteProjectAction(project.id)}
                onSuccess={() => router.push("/admin/projects")}
                className="order-1 justify-center"
              />
            )}
          </div>
        </div>
      </form>

      {mode === "edit" && project && (
        <div className="h-full min-h-0">
          <EditorShell
            initialContent={project.content}
            recordId={project.id}
            contentType="project"
            onSave={autosaveProjectContentAction}
            onReady={editorForm.registerEditor}
            media={media}
            documentTitle={title}
          />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">
          Save the project first — the content editor opens once it has an id to
          autosave against.
        </p>
      )}
    </AuthoringWorkspace>
  );
}
