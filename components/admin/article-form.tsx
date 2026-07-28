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
  createArticleAction,
  updateArticleAction,
  autosaveArticleContentAction,
  deleteArticleAction,
} from "@/app/admin/(dashboard)/journal/actions";

interface ArticleFormProps {
  mode: "create" | "edit";
  article?: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    publishStatus: string;
    tags: string[];
    date: string;
    scheduledFor: string;
    content: JSONContent;
  };
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function ArticleForm({ mode, article }: ArticleFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = mode === "edit" && searchParams.get("created") === "1";

  const action = mode === "create" ? createArticleAction : updateArticleAction.bind(null, article!.id);
  const { state, submit: formAction } = useMetadataAction(
    action,
    mode === "edit" ? `cms:article:${article!.id}:metadata` : undefined
  );
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(article?.publishStatus ?? "DRAFT");
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);

  return (
    <div className="space-y-8">
      <form onSubmit={editorForm.onSubmit} className="space-y-6">
        {justCreated && <FormMessage variant="success">Journal entry created — autosave is on below.</FormMessage>}

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
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" name="summary" defaultValue={article?.summary} required />
              <FieldError errors={state.errors?.summary} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={article?.category} required />
                <FieldError errors={state.errors?.category} />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" defaultValue={article?.tags.join(", ")} />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={article?.date} required />
                <FieldError errors={state.errors?.date} />
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
                  <Input id="scheduledFor" name="scheduledFor" type="datetime-local" defaultValue={article?.scheduledFor} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {editorForm.coordinationError && <FormMessage variant="error">{editorForm.coordinationError}</FormMessage>}
          {state.success && state.message && <FormMessage variant="success">{state.message}</FormMessage>}
          {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}
          {!state.success && state.errors && (
            <FormMessage variant="error">Fix the highlighted metadata fields, then save again.</FormMessage>
          )}
          <div className="flex items-center justify-between">
          <SubmitButton
            pendingLabel={mode === "create" ? "Creating..." : "Saving changes..."}
            forcePending={editorForm.isCoordinating}
          >
            {mode === "create" ? "Create entry" : "Save changes"}
          </SubmitButton>
          {mode === "edit" && article && (
            <DeleteButton
              contentType="article"
              recordTitle={article.title}
              onDelete={() => deleteArticleAction(article.id)}
              onSuccess={() => router.push("/admin/journal")}
            />
          )}
          </div>
        </div>
      </form>

      {mode === "edit" && article && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Content</h2>
          <EditorShell
            initialContent={article.content}
            recordId={article.id}
            contentType="article"
            onSave={autosaveArticleContentAction}
            onReady={editorForm.registerEditor}
          />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">Save the entry first — the content editor opens once it has an id to autosave against.</p>
      )}
    </div>
  );
}
