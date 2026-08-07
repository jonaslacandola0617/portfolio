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
import { articleTemplates } from "@/lib/editor/templates";
import { AuthoringWorkspace } from "@/components/admin/authoring-workspace";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import {
  createArticleAction,
  updateArticleAction,
  autosaveArticleContentAction,
  deleteArticleAction,
} from "@/app/admin/(dashboard)/journal/actions";

interface ArticleFormProps {
  mode: "create" | "edit";
  media?: AdminMediaItem[];
  templateId?: string;
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

export function ArticleForm({ mode, article, media = [], templateId }: ArticleFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = mode === "edit" && searchParams.get("created") === "1";

  const action =
    mode === "create"
      ? createArticleAction
      : updateArticleAction.bind(null, article!.id);
  const { state, submit: formAction } = useMetadataAction(
    action,
    mode === "edit" ? `cms:article:${article!.id}:metadata` : undefined,
  );
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(
    article?.publishStatus ?? "DRAFT",
  );
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);

  return (
    <AuthoringWorkspace
      enabled={mode === "edit"}
      storageKey="cms:article:inspector"
      contentLabel="journal entry"
      title={title}
      backHref="/admin/journal"
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
            messages={{
              created: "Journal entry created — autosave is on below.",
            }}
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
                  defaultValue={article?.summary}
                  required
                />
                <FieldError errors={state.errors?.summary} />
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
                    defaultValue={article?.category}
                    required
                  />
                  <FieldError errors={state.errors?.category} />
                </div>
                <div>
                  <Label>Tags</Label>
                  <TaxonomyMultiCombobox
                    name="tags"
                    kind="tag"
                    label="Tags"
                    defaultValues={article?.tags}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={article?.date}
                    required
                  />
                  <FieldError errors={state.errors?.date} />
                </div>
              </div>

              <div
                className={
                  mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"
                }
              >
                <div>
                  <Label htmlFor="publishStatus">Publish status</Label>
                  <p className="mb-2 mt-1 text-xs text-muted-foreground">
                    Publish manually when the article is ready.
                  </p>
                  <select
                    id="publishStatus"
                    name="publishStatus"
                    value={publishStatus}
                    onChange={(e) => setPublishStatus(e.target.value)}
                    className="flex h-10 w-full border border-border bg-surface px-3 text-sm"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {mode === "create" && !templateId && (
            <TemplateSelector templates={articleTemplates} />
          )}
          {mode === "create" && templateId && <input type="hidden" name="templateId" value={templateId} />}

          {mode === "edit" && (
            <div className="border border-vermilion/30 bg-vermilion/5 p-4">
              <p className="label mb-1 text-vermilion">Danger Zone</p>
              <p className="text-xs text-text-dim">
                Deleting this journal entry removes it from the public site immediately.
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
              {mode === "create" ? "Create entry" : "Save changes"}
            </SubmitButton>
            {mode === "edit" && article && (
              <DeleteButton
                variant="sheet"
                label="Delete this journal entry"
                contentType="article"
                recordTitle={article.title}
                onDelete={() => deleteArticleAction(article.id)}
                onSuccess={() => router.push("/admin/journal")}
                className="order-1 justify-center"
              />
            )}
          </div>
        </div>
      </form>

      {mode === "edit" && article && (
        <div className="h-full min-h-0">
          <EditorShell
            initialContent={article.content}
            recordId={article.id}
            contentType="article"
            onSave={autosaveArticleContentAction}
            onReady={editorForm.registerEditor}
            media={media}
            documentTitle={title}
          />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">
          Save the entry first — the content editor opens once it has an id to
          autosave against.
        </p>
      )}
    </AuthoringWorkspace>
  );
}
