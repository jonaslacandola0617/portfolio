"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Save } from "lucide-react";
import { updateAboutAction } from "@/app/admin/(dashboard)/about/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/admin/form-message";
import type { AboutPageValues } from "@/lib/validations/about";
import type { ActionResult } from "@/types/admin";
import { useToast } from "@/components/ui/toast";

const initialState: ActionResult = { success: false };

export function AboutForm({ about }: { about: AboutPageValues }) {
  const [state, action] = useFormState(updateAboutAction, initialState);
  const { success } = useToast();
  useEffect(() => { if (state.success && state.message) success(state.message, { id: "about-page-save" }); }, [state.message, state.success, success]);

  return (
    <form action={action} className="max-w-2xl space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="eyebrow">Eyebrow</Label><Input  id="eyebrow" name="eyebrow" defaultValue={about.eyebrow} required /></div>
        <div><Label htmlFor="title">Page Title</Label><Input  id="title" name="title" defaultValue={about.title} required /></div>
      </div>
      <div><Label htmlFor="description">Header Description</Label><Textarea  id="description" name="description" defaultValue={about.description} required /></div>
      <div><Label htmlFor="paragraphs">Biography</Label><Textarea  id="paragraphs" name="paragraphs" rows={10} defaultValue={about.paragraphs.join("\n")} required /><p className="mt-1 text-[11px] text-muted">One paragraph per line.</p></div>

      <div className="border-t border-border pt-6">
        <p className="label mb-4">Working Philosophy</p>
        <div className="space-y-4">
          {about.pillars.map((pillar, index) => (
            <div key={index} className="grid gap-3 border border-border p-4 sm:grid-cols-[150px_1fr]">
              <div><Label htmlFor={`pillarIcon${index}`}>Icon</Label><select id={`pillarIcon${index}`} name={`pillarIcon${index}`} defaultValue={pillar.icon} className="flex h-10 w-full border border-border bg-surface-2 px-3 text-sm text-text outline-none focus:border-cobalt"><option value="compass">Compass</option><option value="wrench">Wrench</option><option value="refresh">Refresh</option></select></div>
              <div><Label htmlFor={`pillarTitle${index}`}>Title</Label><Input  id={`pillarTitle${index}`} name={`pillarTitle${index}`} defaultValue={pillar.title} required /></div>
              <div className="sm:col-span-2"><Label htmlFor={`pillarBody${index}`}>Description</Label><Textarea  id={`pillarBody${index}`} name={`pillarBody${index}`} defaultValue={pillar.body} required /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="label mb-4">Current Focus</p>
        <div><Label htmlFor="focusLabel">Section Label</Label><Input  id="focusLabel" name="focusLabel" defaultValue={about.focusLabel} required /></div>
        <div className="mt-4"><Label htmlFor="currentFocus">Focus Items</Label><Textarea  id="currentFocus" name="currentFocus" rows={7} defaultValue={about.currentFocus.join("\n")} /><p className="mt-1 text-[11px] text-muted">One item per line.</p></div>
      </div>

      {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}
      <button type="submit" className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"><Save className="h-3.5 w-3.5" /> Save About page</button>
    </form>
  );
}
