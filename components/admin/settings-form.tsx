"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { ChevronDown, ExternalLink, FileText, Plus, Save, Trash2 } from "lucide-react";
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

interface LearningItem {
  key: string;
  label: string;
  href: string;
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
  const [state, formAction] = useFormState(updateSettingsAction, initialState);
  const { success } = useToast();
  const initialResumeUrl = resumeMedia.some((item) => item.url === settings.resumeUrl) ? settings.resumeUrl : "";
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl);
  const nextLearningKey = useRef(settings.currentlyLearning.length);
  const [learningItems, setLearningItems] = useState<LearningItem[]>(() =>
    (settings.currentlyLearning.length ? settings.currentlyLearning : [{ label: "", href: "" }])
      .map((item, index) => ({ ...item, key: `initial-${index}` })),
  );
  const selectedResume = resumeMedia.find((item) => item.url === resumeUrl);

  useEffect(() => {
    if (state.success) success(state.message ?? "Settings saved.", { id: "settings-save" });
  }, [state.message, state.success, success]);

  function updateLearningItem(index: number, key: "label" | "href", value: string) {
    setLearningItems((items) =>
      items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    );
  }

  return (
    <form action={formAction} className="admin-control-settings-form">
      <section className="admin-form-section">
        <header><span>01</span><div><h2>Identity</h2><p>The name and positioning used across the public portfolio.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field"><Label htmlFor="name">Display Name</Label><Input id="name" name="name" defaultValue={settings.name} required /><FieldError errors={state.errors?.name} /></div>
          <div className="admin-field"><Label htmlFor="role">Role / Tagline</Label><Input id="role" name="role" defaultValue={settings.role} required /><FieldError errors={state.errors?.role} /></div>
          <div className="admin-field is-full"><Label htmlFor="tagline">Intro Statement</Label><Textarea id="tagline" name="tagline" rows={3} defaultValue={settings.tagline} required /><FieldError errors={state.errors?.tagline} /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>02</span><div><h2>Contact</h2><p>Public contact and profile destinations.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field is-full"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={settings.email} required /><FieldError errors={state.errors?.email} /></div>
          <div className="admin-field"><Label htmlFor="githubUrl">GitHub URL</Label><Input id="githubUrl" name="githubUrl" type="url" defaultValue={settings.githubUrl} required /><FieldError errors={state.errors?.githubUrl} /></div>
          <div className="admin-field"><Label htmlFor="linkedinUrl">LinkedIn URL</Label><Input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={settings.linkedinUrl} required /><FieldError errors={state.errors?.linkedinUrl} /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>03</span><div><h2>Résumé</h2><p>Select the PDF served by the public résumé page.</p></div></header>
        <div className="admin-form-section-body">
          <div className="admin-field">
            <div className="admin-field-label-row">
              <Label htmlFor="resumeUrl">Media Library PDF</Label>
              <Link href="/admin/media">Manage media <ExternalLink aria-hidden="true" /></Link>
            </div>
            <div className="admin-select-wrap">
              <select id="resumeUrl" name="resumeUrl" value={resumeUrl} onChange={(event) => setResumeUrl(event.target.value)} required disabled={resumeMedia.length === 0}>
                <option value="" disabled>{resumeMedia.length ? "Select an uploaded PDF" : "Upload a PDF in Media Library first"}</option>
                {resumeMedia.map((item) => <option key={item.id} value={item.url}>{item.filename}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </div>
            <FieldError errors={state.errors?.resumeUrl} />
            {settings.resumeUrl && !initialResumeUrl && (
              <p className="admin-field-note is-warning">The existing résumé is not registered in the Media Library. Select an uploaded PDF before saving.</p>
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

      <section className="admin-form-section">
        <header><span>04</span><div><h2>Currently learning</h2><p>Each item needs a readable label and a public or local destination.</p></div></header>
        <div className="admin-form-section-body">
          <div className="admin-learning-list">
            {learningItems.map((item, index) => (
              <div className="admin-learning-row" key={item.key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="admin-field"><Label htmlFor={`learning-label-${index}`}>Label</Label><Input id={`learning-label-${index}`} name="learningLabel" value={item.label} onChange={(event) => updateLearningItem(index, "label", event.target.value)} required /></div>
                <div className="admin-field"><Label htmlFor={`learning-href-${index}`}>Destination</Label><Input id={`learning-href-${index}`} name="learningHref" value={item.href} onChange={(event) => updateLearningItem(index, "href", event.target.value)} placeholder="/labs or https://…" required /></div>
                <button type="button" onClick={() => setLearningItems((items) => items.filter((entry) => entry.key !== item.key))} disabled={learningItems.length === 1} aria-label={`Remove learning item ${index + 1}`}><Trash2 aria-hidden="true" /></button>
              </div>
            ))}
          </div>
          <button type="button" className="admin-add-row" onClick={() => {
            const key = `new-${nextLearningKey.current}`;
            nextLearningKey.current += 1;
            setLearningItems((items) => [...items, { key, label: "", href: "" }]);
          }}><Plus aria-hidden="true" /> Add learning item</button>
          <FieldError errors={state.errors?.currentlyLearning} />
        </div>
      </section>

      <div className="admin-form-actions">
        <span>Changes update the public portfolio after saving.</span>
        <button type="submit" className="admin-control-settings-save"><Save aria-hidden="true" /> Save settings</button>
      </div>
    </form>
  );
}
