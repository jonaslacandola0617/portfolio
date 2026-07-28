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
    logo: string;
    progressStatus: string;
    publishStatus: string;
    progressLabel: string;
    progressPercent: number;
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

export function CertificateForm({ mode, certificate, media = [] }: CertificateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = mode === "edit" && searchParams.get("created") === "1";

  const action = mode === "create" ? createCertificateAction : updateCertificateAction.bind(null, certificate!.id);
  const { state, submit: formAction } = useMetadataAction(
    action,
    mode === "edit" ? `cms:certificate:${certificate!.id}:metadata` : undefined
  );
  const [name, setName] = useState(certificate?.name ?? "");
  const [slug, setSlug] = useState(certificate?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(certificate?.publishStatus ?? "DRAFT");
  const editorForm = useEditorFormCoordination(mode === "edit", formAction);

  return (
    <AuthoringWorkspace enabled={mode === "edit"} storageKey="cms:certificate:inspector">
      <form onSubmit={editorForm.onSubmit} className="space-y-6">
        {justCreated && <FormMessage variant="success">Certificate created — autosave is on below.</FormMessage>}

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={name} onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }} required />
                <FieldError errors={state.errors?.name} />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} required />
                <FieldError errors={state.errors?.slug} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="issuer">Issuer</Label>
                <Input id="issuer" name="issuer" defaultValue={certificate?.issuer} required />
                <FieldError errors={state.errors?.issuer} />
              </div>
              <div>
                <Label htmlFor="logo">Logo</Label>
                <select id="logo" name="logo" defaultValue={certificate?.logo ?? "google"} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="google">Google</option>
                  <option value="cisco">Cisco</option>
                  <option value="linux">Linux</option>
                  <option value="python">Python</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="progressLabel">Progress label</Label>
                <Input id="progressLabel" name="progressLabel" defaultValue={certificate?.progressLabel} placeholder="Module 8 of 17" required />
                <FieldError errors={state.errors?.progressLabel} />
              </div>
              <div>
                <Label htmlFor="progressPercent">Progress %</Label>
                <Input id="progressPercent" name="progressPercent" type="number" min={0} max={100} defaultValue={certificate?.progressPercent ?? 0} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="progressStatus">Status</Label>
                <select id="progressStatus" name="progressStatus" defaultValue={certificate?.progressStatus ?? "IN_PROGRESS"} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateStarted">Date started</Label>
                <Input id="dateStarted" name="dateStarted" type="date" defaultValue={certificate?.dateStarted} required />
                <FieldError errors={state.errors?.dateStarted} />
              </div>
              <div>
                <Label htmlFor="dateCompleted">Date completed</Label>
                <Input id="dateCompleted" name="dateCompleted" type="date" defaultValue={certificate?.dateCompleted} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Skills learned</Label>
                <TaxonomyMultiCombobox name="skills" kind="skill" label="Skills learned" defaultValues={certificate?.skills} />
              </div>
              <div>
                <Label htmlFor="credentialUrl">Credential URL</Label>
                <Input id="credentialUrl" name="credentialUrl" type="url" defaultValue={certificate?.credentialUrl} />
                <FieldError errors={state.errors?.credentialUrl} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="publishStatus">Publish status</Label>
                <select id="publishStatus" name="publishStatus" value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">Publish manually when the certificate is ready.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-10 space-y-3 border-t border-border bg-card/95 py-3 backdrop-blur">
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
            {mode === "create" ? "Create certificate" : "Save changes"}
          </SubmitButton>
          {mode === "edit" && certificate && (
            <DeleteButton
              contentType="certificate"
              recordTitle={certificate.name}
              onDelete={() => deleteCertificateAction(certificate.id)}
              onSuccess={() => router.push("/admin/certificates")}
            />
          )}
          </div>
        </div>
      </form>

      {mode === "edit" && certificate && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Write-up (optional)
          </h2>
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
        <p className="text-sm text-muted-foreground">Save the certificate first to add an optional longer write-up.</p>
      )}
    </AuthoringWorkspace>
  );
}
