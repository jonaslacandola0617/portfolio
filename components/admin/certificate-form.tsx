"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EditorShell } from "@/components/editor/editor-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { FormMessage } from "@/components/admin/form-message";
import { DeleteButton } from "@/components/admin/delete-button";
import { slugify } from "@/lib/utils";
import { useEditorFormCoordination } from "@/hooks/use-editor-form-coordination";
import { useMetadataAction } from "@/hooks/use-metadata-action";
import { TaxonomyMultiCombobox } from "@/components/admin/taxonomy-combobox";
import { AuthoringWorkspace } from "@/components/admin/authoring-workspace";
import { SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CertificateLogoPicker } from "@/components/admin/certificate-logo-picker";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import { DateSelector } from "@/components/admin/date-selector";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import {
  createCertificateAction,
  updateCertificateAction,
  autosaveCertificateContentAction,
  deleteCertificateAction,
} from "@/app/admin/(dashboard)/certificates/actions";

interface CertificateFormProps {
  mode: "create" | "edit";
  media?: AdminMediaItem[];
  certificate?: {
    id: string;
    name: string;
    slug: string;
    issuer: string;
    logoMediaId: string;
    publishStatus: string;
    skills: string[];
    dateStarted: string;
    dateCompleted: string;
    credentialUrl: string;
    scheduledFor: string;
    content: JSONContent;
  };
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function CertificateForm({
  mode,
  certificate,
  media = [],
}: CertificateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = mode === "edit" && searchParams.get("created") === "1";

  const action =
    mode === "create"
      ? createCertificateAction
      : updateCertificateAction.bind(null, certificate!.id);
  const { state, submit: formAction } = useMetadataAction(
    action,
    mode === "edit" ? `cms:certificate:${certificate!.id}:metadata` : undefined,
  );
  const [name, setName] = useState(certificate?.name ?? "");
  const [slug, setSlug] = useState(certificate?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(
    certificate?.publishStatus ?? "DRAFT",
  );
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);

  return (
    <AuthoringWorkspace
      enabled={mode === "edit"}
      storageKey="cms:certificate:inspector"
      contentLabel="certificate"
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
            messages={{
              created: "Certificate created — autosave is on below.",
            }}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  required
                />
                <FieldError errors={state.errors?.name} />
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

            <div
              className={
                mode === "edit" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"
              }
            >
              <div className="sm:col-span-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  name="issuer"
                  defaultValue={certificate?.issuer}
                  required
                />
                <FieldError errors={state.errors?.issuer} />
              </div>
            </div>

            <div className="grid items-end gap-4 sm:grid-cols-2">
              <div>
                <DateSelector
                  id="dateCompleted"
                  name="dateCompleted"
                  label="Completion Date"
                  defaultValue={certificate?.dateCompleted}
                  optional
                />
                <FieldError errors={state.errors?.dateCompleted} />
              </div>
              <div>
                <DateSelector
                  id="dateStarted"
                  name="dateStarted"
                  label="Start Date"
                  defaultValue={certificate?.dateStarted}
                  optional
                />
                <FieldError errors={state.errors?.dateStarted} />
              </div>
            </div>

            <div className="grid items-end gap-4 sm:grid-cols-2">
              <div>
                <Label>Skills learned</Label>
                <TaxonomyMultiCombobox
                  name="skills"
                  kind="skill"
                  label="Skills learned"
                  defaultValues={certificate?.skills}
                />
              </div>
              <div>
                <Label htmlFor="credentialUrl">Credential URL</Label>
                <Input
                  id="credentialUrl"
                  name="credentialUrl"
                  type="url"
                  defaultValue={certificate?.credentialUrl}
                />
                <FieldError errors={state.errors?.credentialUrl} />
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
                  Publish manually when the certificate is ready.
                </p>
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
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Certificate Logo</Label>
              <p className="mb-2 mt-1 text-xs text-muted-foreground">
                Upload or choose the issuer/certification image shown publicly.
              </p>
              <CertificateLogoPicker
                media={media}
                initialMediaId={certificate?.logoMediaId}
              />
              <FieldError errors={state.errors?.logoMediaId} />
            </div>
          </CardContent>
        </Card>
        </div>

        <div
          className={
            mode === "edit"
              ? "space-y-2 bg-card px-6 py-4"
              : "space-y-3"
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
                : "flex items-center justify-end gap-2"
            }
          >
            <SubmitButton
              pendingLabel={
                mode === "create" ? "Creating..." : "Saving changes..."
              }
              forcePending={editorForm.isCoordinating}
              className={mode === "edit" ? "w-full" : undefined}
            >
              {mode === "create" ? "Create certificate" : "Save changes"}
            </SubmitButton>
            {mode === "edit" && certificate && (
              <DeleteButton
                contentType="certificate"
                recordTitle={certificate.name}
                onDelete={() => deleteCertificateAction(certificate.id)}
                onSuccess={() => router.push("/admin/certificates")}
                className="w-full justify-center"
              />
            )}
          </div>
        </div>
      </form>

      {mode === "edit" && certificate && (
        <div className="h-full min-h-0">
          <EditorShell
            initialContent={certificate.content}
            recordId={certificate.id}
            contentType="certificate"
            onSave={autosaveCertificateContentAction}
            onReady={editorForm.registerEditor}
            media={media}
          />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">
          Save the certificate first to add an optional longer write-up.
        </p>
      )}
    </AuthoringWorkspace>
  );
}
