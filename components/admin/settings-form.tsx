"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "@/app/admin/(dashboard)/settings/actions";
import type { ActionResult } from "@/types/admin";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { useToast } from "@/components/ui/toast";

const initialState: ActionResult = { success: false };
function FieldError({ errors }: { errors?: string[] }) { return errors?.length ? <p className="mt-1 text-xs text-vermilion">{errors[0]}</p> : null; }

export function SettingsForm({ settings }: { settings: SiteSettingsData }) {
  const [state, formAction] = useFormState(updateSettingsAction, initialState);
  const { success } = useToast();
  const learningLines = settings.currentlyLearning.map((item) => `${item.label} | ${item.href}`).join("\n");
  useEffect(() => { if (state.success) success(state.message ?? "Settings saved.", { id: "settings-save" }); }, [state.message, state.success, success]);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div><Label htmlFor="name">Display Name</Label><Input  id="name" name="name" defaultValue={settings.name} required /><FieldError errors={state.errors?.name} /></div>
      <div><Label htmlFor="role">Role / Tagline</Label><Input  id="role" name="role" defaultValue={settings.role} required /><FieldError errors={state.errors?.role} /></div>
      <div><Label htmlFor="tagline">Intro Statement</Label><Textarea  id="tagline" name="tagline" defaultValue={settings.tagline} required /><FieldError errors={state.errors?.tagline} /></div>
      <div><Label htmlFor="email">Email</Label><Input  id="email" name="email" type="email" defaultValue={settings.email} required /><FieldError errors={state.errors?.email} /></div>
      <div><Label htmlFor="githubUrl">GitHub URL</Label><Input  id="githubUrl" name="githubUrl" type="url" defaultValue={settings.githubUrl} required /><FieldError errors={state.errors?.githubUrl} /></div>
      <div><Label htmlFor="linkedinUrl">LinkedIn URL</Label><Input  id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={settings.linkedinUrl} required /><FieldError errors={state.errors?.linkedinUrl} /></div>
      <div><Label htmlFor="resumeUrl">Resume Path</Label><Input  id="resumeUrl" name="resumeUrl" defaultValue={settings.resumeUrl} required /><FieldError errors={state.errors?.resumeUrl} /></div>
      <div><Label htmlFor="currentlyLearning">Currently Learning</Label><Textarea  id="currentlyLearning" name="currentlyLearning" rows={6} defaultValue={learningLines} placeholder="Label | /href" /><p className="mt-1 text-[11px] text-muted">One item per line: Label | /href</p></div>
      <button type="submit" className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"><Save className="h-3.5 w-3.5" /> Save settings</button>
    </form>
  );
}
