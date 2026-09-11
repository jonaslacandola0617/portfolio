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

type ProjectOption = { id: string; title: string };

export function SettingsForm({
  settings,
  projectOptions,
}: {
  settings: SiteSettingsData;
  projectOptions: ProjectOption[];
}) {
  const [state, formAction] = useFormState(updateSettingsAction, initialState);
  const { success } = useToast();
  const learningLines = settings.currentlyLearning.map((item) => `${item.label} | ${item.href}`).join("\n");
  useEffect(() => { if (state.success) success(state.message ?? "Settings saved.", { id: "settings-save" }); }, [state.message, state.success, success]);

  return (
    <form action={formAction} className="admin-control-settings-form space-y-0">
      <div><Label htmlFor="name">Display Name</Label><Input id="name" name="name" defaultValue={settings.name} required /><FieldError errors={state.errors?.name} /></div>
      <div><Label htmlFor="role">Role / Tagline</Label><Input id="role" name="role" defaultValue={settings.role} required /><FieldError errors={state.errors?.role} /></div>
      <div><Label htmlFor="tagline">Intro Statement</Label><Textarea id="tagline" name="tagline" defaultValue={settings.tagline} required /><FieldError errors={state.errors?.tagline} /></div>
      <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={settings.email} required /><FieldError errors={state.errors?.email} /></div>
      <div><Label htmlFor="githubUrl">GitHub URL</Label><Input id="githubUrl" name="githubUrl" type="url" defaultValue={settings.githubUrl} required /><FieldError errors={state.errors?.githubUrl} /></div>
      <div><Label htmlFor="linkedinUrl">LinkedIn URL</Label><Input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={settings.linkedinUrl} required /><FieldError errors={state.errors?.linkedinUrl} /></div>
      <div><Label htmlFor="resumeUrl">Resume Path</Label><Input id="resumeUrl" name="resumeUrl" defaultValue={settings.resumeUrl} required /><FieldError errors={state.errors?.resumeUrl} /></div>
      <div><Label htmlFor="currentlyLearning">Currently Learning</Label><Textarea id="currentlyLearning" name="currentlyLearning" rows={6} defaultValue={learningLines} placeholder="Label | /href" /><p className="mt-2 text-[10px] text-muted">One item per line: Label | /href</p></div>

      <div className="admin-control-showcase-settings">
        <div className="admin-control-showcase-copy">
          <span>HOMEPAGE / SHOWCASE</span>
          <h2>Choose what leads the work.</h2>
          <p>Pick the two published projects shown in the homepage showcase, in order. Leave either slot on automatic to let the existing fallback choose a suitable project.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="homepagePrimaryProjectId">Primary Project</Label>
            <select
              id="homepagePrimaryProjectId"
              name="homepagePrimaryProjectId"
              defaultValue={settings.homepageProjectIds[0] ?? ""}
              className="h-10 w-full border-b border-border-strong bg-transparent text-sm text-text outline-none focus:border-cobalt"
            >
              <option value="">Automatic</option>
              {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="homepageSecondaryProjectId">Secondary Project</Label>
            <select
              id="homepageSecondaryProjectId"
              name="homepageSecondaryProjectId"
              defaultValue={settings.homepageProjectIds[1] ?? ""}
              className="h-10 w-full border-b border-border-strong bg-transparent text-sm text-text outline-none focus:border-cobalt"
            >
              <option value="">Automatic</option>
              {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </div>
        </div>
        <FieldError errors={state.errors?.homepageProjectIds} />
      </div>

      <button type="submit" className="admin-control-settings-save flex items-center gap-2 border px-4 py-2.5 text-sm font-medium"><Save className="h-3.5 w-3.5" /> Save settings</button>
    </form>
  );
}
