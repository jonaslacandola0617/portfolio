"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ChevronDown, ExternalLink, FileText, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "@/app/admin/(dashboard)/settings/actions";
import type { ActionResult } from "@/types/admin";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { useToast } from "@/components/ui/toast";

const initialState: ActionResult = { success: false };

interface ResumeMediaOption {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="admin-field-error">{errors[0]}</p> : null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsForm({ settings, resumeMedia }: { settings: SiteSettingsData; resumeMedia: ResumeMediaOption[] }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);
  const { success } = useToast();
  const initialResumeUrl = resumeMedia.some((item) => item.url === settings.resumeUrl) ? settings.resumeUrl : "";
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl);
  const selectedResume = resumeMedia.find((item) => item.url === resumeUrl);

  useEffect(() => {
    if (state.success) success(state.message ?? "Settings saved.", { id: "settings-save" });
  }, [state.message, state.success, success]);

  return (
    <form action={formAction} className="admin-control-settings-form">
      <section className="admin-form-section">
        <header><span>01</span><div><h2>Identity</h2><p>Your name and role, used across the whole public site.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" name="name" defaultValue={settings.name} required />
            <p className="admin-field-note">Header, footer, browser tab and link previews.</p>
            <FieldError errors={state.errors?.name} />
          </div>
          <div className="admin-field">
            <Label htmlFor="role">Role</Label>
            <Input id="role" name="role" defaultValue={settings.role} required placeholder="IT Support · Networking · Cybersecurity" />
            <p className="admin-field-note">Browser tab title, link previews, About and Résumé. Separate roles with “·” and each becomes a chip under the homepage headline.</p>
            <FieldError errors={state.errors?.role} />
          </div>
          <div className="admin-field is-full">
            <Label htmlFor="tagline">Short bio</Label>
            <Textarea id="tagline" name="tagline" rows={3} defaultValue={settings.tagline} required />
            <p className="admin-field-note">The intro under the About page heading. The homepage intro is edited in <Link href="/admin/homepage#hero">Homepage › Hero</Link>.</p>
            <FieldError errors={state.errors?.tagline} />
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>02</span><div><h2>Contact</h2><p>Shown in the footer on every page, on Contact and on Résumé.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field is-full">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={settings.email} required />
            <p className="admin-field-note">Visitors can copy it with one click. Use the same address as on your résumé.</p>
            <FieldError errors={state.errors?.email} />
          </div>
          <div className="admin-field"><Label htmlFor="githubUrl">GitHub URL</Label><Input id="githubUrl" name="githubUrl" type="url" defaultValue={settings.githubUrl} required /><FieldError errors={state.errors?.githubUrl} /></div>
          <div className="admin-field"><Label htmlFor="linkedinUrl">LinkedIn URL</Label><Input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={settings.linkedinUrl} required /><FieldError errors={state.errors?.linkedinUrl} /></div>
        </div>
      </section>

      <section className="admin-form-section" id="resume">
        <header><span>03</span><div><h2>Résumé</h2><p>The PDF behind every “Résumé” button and the Résumé page. Upload a new version in Media, then pick it here.</p></div></header>
        <div className="admin-form-section-body">
          <div className="admin-field">
            <div className="admin-field-label-row">
              <Label htmlFor="resumeUrl">Résumé PDF</Label>
              <Link href="/admin/media">Upload in Media <ExternalLink aria-hidden="true" /></Link>
            </div>
            <div className="admin-select-wrap">
              <select id="resumeUrl" name="resumeUrl" value={resumeUrl} onChange={(event) => setResumeUrl(event.target.value)} required disabled={resumeMedia.length === 0}>
                <option value="" disabled>{resumeMedia.length ? "Select an uploaded PDF" : "Upload a PDF in Media first"}</option>
                {resumeMedia.map((item) => <option key={item.id} value={item.url}>{item.filename}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </div>
            <FieldError errors={state.errors?.resumeUrl} />
            {settings.resumeUrl && !initialResumeUrl && (
              <p className="admin-field-note is-warning">The current résumé isn&apos;t in the Media Library. Pick an uploaded PDF before saving.</p>
            )}
          </div>
          {selectedResume && (
            <div className="admin-selected-media" aria-live="polite">
              <FileText aria-hidden="true" />
              <div><strong>{selectedResume.filename}</strong><span>{formatBytes(selectedResume.size)} · Uploaded {dateFormatter.format(new Date(selectedResume.uploadedAt))}</span></div>
              <a href={selectedResume.url} target="_blank" rel="noreferrer">Preview <ExternalLink aria-hidden="true" /></a>
            </div>
          )}
        </div>
      </section>

      <div className="admin-form-actions">
        <span>Saving updates the live site right away.</span>
        <button type="submit" className="admin-control-settings-save" disabled={pending}><Save aria-hidden="true" /> {pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
