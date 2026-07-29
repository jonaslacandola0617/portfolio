"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateSettingsAction } from "@/app/admin/(dashboard)/settings/actions";
import type { ActionResult } from "@/types/admin";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { useToast } from "@/components/ui/toast";

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function SettingsForm({ settings }: { settings: SiteSettingsData }) {
  const [state, formAction] = useFormState(updateSettingsAction, initialState);
  const { success } = useToast();
  const learningLines = settings.currentlyLearning.map((l) => `${l.label} | ${l.href}`).join("\n");

  useEffect(() => {
    if (state.success) {
      success(state.message ?? "Settings saved.", { id: "settings-save" });
    }
  }, [state.message, state.success, success]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={settings.name} required />
              <FieldError errors={state.errors?.name} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" defaultValue={settings.role} required />
              <FieldError errors={state.errors?.role} />
            </div>
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Textarea id="tagline" name="tagline" defaultValue={settings.tagline} required />
            <FieldError errors={state.errors?.tagline} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={settings.email} required />
              <FieldError errors={state.errors?.email} />
            </div>
            <div>
              <Label htmlFor="resumeUrl">Resume path</Label>
              <Input id="resumeUrl" name="resumeUrl" defaultValue={settings.resumeUrl} required />
              <FieldError errors={state.errors?.resumeUrl} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input id="githubUrl" name="githubUrl" type="url" defaultValue={settings.githubUrl} required />
              <FieldError errors={state.errors?.githubUrl} />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={settings.linkedinUrl} required />
              <FieldError errors={state.errors?.linkedinUrl} />
            </div>
          </div>

          <div>
            <Label htmlFor="currentlyLearning">Currently Learning (one per line: Label | /href)</Label>
            <Textarea
              id="currentlyLearning"
              name="currentlyLearning"
              rows={6}
              defaultValue={learningLines}
              placeholder={"CCNA Module 8 | /certifications\nGoogle Cybersecurity Course 2 | /certifications"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit">Save settings</Button>
      </div>
    </form>
  );
}
