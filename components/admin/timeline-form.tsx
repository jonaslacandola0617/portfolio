"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/admin/submit-button";
import { FormMessage } from "@/components/admin/form-message";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  createTimelineAction,
  updateTimelineAction,
  deleteTimelineAction,
} from "@/app/admin/(dashboard)/timeline/actions";
import type { ActionResult } from "@/types/admin";

interface TimelineFormProps {
  mode: "create" | "edit";
  entry?: {
    id: string;
    title: string;
    description: string;
    date: string;
    category: string;
    publishStatus: string;
    tags: string[];
    scheduledFor: string;
  };
}

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-vermilion">{errors[0]}</p>;
}

export function TimelineForm({ mode, entry }: TimelineFormProps) {
  const router = useRouter();
  const action = mode === "create" ? createTimelineAction : updateTimelineAction.bind(null, entry!.id);
  const [state, formAction] = useFormState(action, initialState);
  const [publishStatus, setPublishStatus] = useState(entry?.publishStatus ?? "PUBLISHED");

  return (
    <form action={formAction} className="space-y-6">
      {/* This action redirects to /admin/timeline?created=1 / ?updated=1
          on success (see actions.ts) — a success message here would
          never actually render, since the component unmounts on
          navigation. Only the failure path renders locally. */}
      {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={entry?.title} required />
            <FieldError errors={state.errors?.title} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={entry?.description} required />
            <FieldError errors={state.errors?.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={entry?.date} required />
              <FieldError errors={state.errors?.date} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" defaultValue={entry?.category ?? "networking"} className="flex h-10 w-full border border-border bg-surface px-3 text-sm">
                <option value="networking">Networking</option>
                <option value="security">Security</option>
                <option value="linux">Linux</option>
                <option value="programming">Programming</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" name="tags" defaultValue={entry?.tags.join(", ")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="publishStatus">Publish status</Label>
              <select id="publishStatus" name="publishStatus" value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)} className="flex h-10 w-full border border-border bg-surface px-3 text-sm">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <p className="mt-1.5 text-xs text-text-dim">Publish manually when the entry is ready.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
          {mode === "create" ? "Create entry" : "Save changes"}
        </SubmitButton>
        {mode === "edit" && entry && (
          <DeleteButton
            contentType="timeline entry"
            recordTitle={entry.title}
            onDelete={() => deleteTimelineAction(entry.id)}
            onSuccess={() => router.push("/admin/timeline")}
          />
        )}
      </div>
    </form>
  );
}
