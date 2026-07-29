"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { updateAboutAction } from "@/app/admin/(dashboard)/about/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/admin/submit-button";
import { FormMessage } from "@/components/admin/form-message";
import type { AboutPageValues } from "@/lib/validations/about";
import type { ActionResult } from "@/types/admin";
import { useToast } from "@/components/ui/toast";

const initialState: ActionResult = { success: false };

export function AboutForm({ about }: { about: AboutPageValues }) {
  const [state, action] = useFormState(updateAboutAction, initialState);
  const { success } = useToast();

  useEffect(() => {
    if (state.success && state.message) {
      success(state.message, { id: "about-page-save" });
    }
  }, [state.message, state.success, success]);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="eyebrow">Eyebrow</Label><Input id="eyebrow" name="eyebrow" defaultValue={about.eyebrow} required /></div>
            <div><Label htmlFor="title">Page title</Label><Input id="title" name="title" defaultValue={about.title} required /></div>
          </div>
          <div><Label htmlFor="description">Header description</Label><Textarea id="description" name="description" defaultValue={about.description} required /></div>
          <div>
            <Label htmlFor="paragraphs">Biography paragraphs</Label>
            <Textarea id="paragraphs" name="paragraphs" rows={12} defaultValue={about.paragraphs.join("\n")} required />
            <p className="mt-1 text-xs text-muted-foreground">One paragraph per line.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Working philosophy</h2>
          {about.pillars.map((pillar, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-[150px_1fr]">
              <div>
                <Label htmlFor={`pillarIcon${index}`}>Icon</Label>
                <select id={`pillarIcon${index}`} name={`pillarIcon${index}`} defaultValue={pillar.icon} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="compass">Compass</option><option value="wrench">Wrench</option><option value="refresh">Refresh</option>
                </select>
              </div>
              <div><Label htmlFor={`pillarTitle${index}`}>Title</Label><Input id={`pillarTitle${index}`} name={`pillarTitle${index}`} defaultValue={pillar.title} required /></div>
              <div className="sm:col-span-2"><Label htmlFor={`pillarBody${index}`}>Description</Label><Textarea id={`pillarBody${index}`} name={`pillarBody${index}`} defaultValue={pillar.body} required /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div><Label htmlFor="focusLabel">Focus section label</Label><Input id="focusLabel" name="focusLabel" defaultValue={about.focusLabel} required /></div>
          <div>
            <Label htmlFor="currentFocus">Current focus</Label>
            <Textarea id="currentFocus" name="currentFocus" rows={7} defaultValue={about.currentFocus.join("\n")} />
            <p className="mt-1 text-xs text-muted-foreground">One badge per line.</p>
          </div>
        </CardContent>
      </Card>

      {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}
      <SubmitButton pendingLabel="Saving About page...">Save About page</SubmitButton>
    </form>
  );
}
