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
  createLabAction,
  updateLabAction,
  autosaveLabContentAction,
  deleteLabAction,
} from "@/app/admin/(dashboard)/labs/actions";
import type { ActionResult } from "@/types/admin";

interface LabFormProps {
  mode: "create" | "edit";
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
  };
}

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function LabForm({ mode, lab }: LabFormProps) {
  const action = mode === "create" ? createLabAction : updateLabAction.bind(null, lab!.id);
  const [state, formAction] = useFormState(action, initialState);
  const [title, setTitle] = useState(lab?.title ?? "");
  const [slug, setSlug] = useState(lab?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(lab?.publishStatus ?? "DRAFT");

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={title} onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }} required />
                <FieldError errors={state.errors?.title} />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} required />
                <FieldError errors={state.errors?.slug} />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea id="purpose" name="purpose" defaultValue={lab?.purpose} required />
              <FieldError errors={state.errors?.purpose} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={lab?.category} required />
                <FieldError errors={state.errors?.category} />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select id="difficulty" name="difficulty" defaultValue={lab?.difficulty ?? "INTERMEDIATE"} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <Label htmlFor="progressStatus">Real-world status</Label>
                <select id="progressStatus" name="progressStatus" defaultValue={lab?.progressStatus ?? "PLANNED"} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" defaultValue={lab?.tags.join(", ")} />
              </div>
              <div>
                <Label htmlFor="labDate">Lab date</Label>
                <Input id="labDate" name="labDate" type="date" defaultValue={lab?.labDate} required />
                <FieldError errors={state.errors?.labDate} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="publishStatus">Publish status</Label>
                <select id="publishStatus" name="publishStatus" value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>
              {publishStatus === "SCHEDULED" && (
                <div>
                  <Label htmlFor="scheduledFor">Scheduled for</Label>
                  <Input id="scheduledFor" name="scheduledFor" type="datetime-local" defaultValue={lab?.scheduledFor} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit">{mode === "create" ? "Create lab" : "Save changes"}</Button>
          {mode === "edit" && (
            <form action={async () => { if (confirm("Delete this lab? This can't be undone.")) await deleteLabAction(lab!.id); }}>
              <Button type="submit" variant="destructive">Delete</Button>
            </form>
          )}
        </div>
      </form>

      {mode === "edit" && lab && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Content</h2>
          <EditorShell initialContent={lab.content} onSave={(content) => autosaveLabContentAction(lab.id, content)} />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">Save the lab first — the content editor opens once it has an id to autosave against.</p>
      )}
    </div>
  );
}
