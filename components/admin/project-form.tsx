"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EditorShell } from "@/components/editor/editor-shell";
import { slugify } from "@/lib/utils";
import {
  createProjectAction,
  updateProjectAction,
  autosaveProjectContentAction,
  deleteProjectAction,
} from "@/app/admin/(dashboard)/projects/actions";
import type { ActionResult } from "@/types/admin";

interface ProjectFormProps {
  mode: "create" | "edit";
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
    scheduledFor: string;
    content: JSONContent;
  };
}

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function ProjectForm({ mode, project }: ProjectFormProps) {
  const action = mode === "create" ? createProjectAction : updateProjectAction.bind(null, project!.id);
  const [state, formAction] = useFormState(action, initialState);
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(project?.publishStatus ?? "DRAFT");

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
              <Textarea id="summary" name="summary" defaultValue={project?.summary} required />
              <FieldError errors={state.errors?.summary} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={project?.category} required />
                <FieldError errors={state.errors?.category} />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={project?.difficulty ?? "INTERMEDIATE"}
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
                  defaultValue={project?.progressStatus ?? "PLANNED"}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" defaultValue={project?.tags.join(", ")} />
              </div>
              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input id="skills" name="skills" defaultValue={project?.skills.join(", ")} />
              </div>
              <div>
                <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                <Input id="technologies" name="technologies" defaultValue={project?.technologies.join(", ")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="estimatedTime">Estimated time</Label>
                <Input id="estimatedTime" name="estimatedTime" defaultValue={project?.estimatedTime} placeholder="4-5 hours" />
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
              <div>
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input id="githubUrl" name="githubUrl" type="url" defaultValue={project?.githubUrl} />
                <FieldError errors={state.errors?.githubUrl} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>
              {publishStatus === "SCHEDULED" && (
                <div>
                  <Label htmlFor="scheduledFor">Scheduled for</Label>
                  <Input id="scheduledFor" name="scheduledFor" type="datetime-local" defaultValue={project?.scheduledFor} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit">{mode === "create" ? "Create project" : "Save changes"}</Button>
          {mode === "edit" && (
            <form
              action={async () => {
                if (confirm("Delete this project? This can't be undone.")) {
                  await deleteProjectAction(project!.id);
                }
              }}
            >
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          )}
        </div>
      </form>

      {mode === "edit" && project && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Content
          </h2>
          <EditorShell
            initialContent={project.content}
            onSave={(content) => autosaveProjectContentAction(project.id, content)}
          />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">
          Save the project first — the content editor opens once it has an id to autosave against.
        </p>
      )}
    </div>
  );
}
