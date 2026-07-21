"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EditorShell } from "@/components/editor/editor-shell";
import { slugify } from "@/lib/utils";
import {
  createCertificateAction,
  updateCertificateAction,
  autosaveCertificateContentAction,
  deleteCertificateAction,
} from "@/app/admin/(dashboard)/certificates/actions";
import type { ActionResult } from "@/types/admin";

interface CertificateFormProps {
  mode: "create" | "edit";
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

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function CertificateForm({ mode, certificate }: CertificateFormProps) {
  const action = mode === "create" ? createCertificateAction : updateCertificateAction.bind(null, certificate!.id);
  const [state, formAction] = useFormState(action, initialState);
  const [name, setName] = useState(certificate?.name ?? "");
  const [slug, setSlug] = useState(certificate?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [publishStatus, setPublishStatus] = useState(certificate?.publishStatus ?? "DRAFT");

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
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
                <Label htmlFor="skills">Skills learned (comma-separated)</Label>
                <Input id="skills" name="skills" defaultValue={certificate?.skills.join(", ")} />
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
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>
              {publishStatus === "SCHEDULED" && (
                <div>
                  <Label htmlFor="scheduledFor">Scheduled for</Label>
                  <Input id="scheduledFor" name="scheduledFor" type="datetime-local" defaultValue={certificate?.scheduledFor} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit">{mode === "create" ? "Create certificate" : "Save changes"}</Button>
          {mode === "edit" && (
            <form action={async () => { if (confirm("Delete this certificate? This can't be undone.")) await deleteCertificateAction(certificate!.id); }}>
              <Button type="submit" variant="destructive">Delete</Button>
            </form>
          )}
        </div>
      </form>

      {mode === "edit" && certificate && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Write-up (optional)
          </h2>
          <EditorShell initialContent={certificate.content} onSave={(content) => autosaveCertificateContentAction(certificate.id, content)} />
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-muted-foreground">Save the certificate first to add an optional longer write-up.</p>
      )}
    </div>
  );
}
