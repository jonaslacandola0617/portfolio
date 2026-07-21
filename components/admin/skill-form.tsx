"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createSkillAction, updateSkillAction, deleteSkillAction } from "@/app/admin/(dashboard)/skills/actions";
import type { ActionResult } from "@/types/admin";

interface SkillFormProps {
  mode: "create" | "edit";
  skill?: { id: string; name: string; group: string; level: string; projects: { slug: string }[] };
}

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
}

export function SkillForm({ mode, skill }: SkillFormProps) {
  const action = mode === "create" ? createSkillAction : updateSkillAction.bind(null, skill!.id);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={skill?.name} required />
              <FieldError errors={state.errors?.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="group">Group</Label>
                <Input id="group" name="group" defaultValue={skill?.group} placeholder="Networking" required />
                <FieldError errors={state.errors?.group} />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <select id="level" name="level" defaultValue={skill?.level ?? "learning"} className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="learning">Learning</option>
                  <option value="practiced">Practiced</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit">{mode === "create" ? "Create skill" : "Save changes"}</Button>
          {mode === "edit" && (
            <form action={async () => { if (confirm("Delete this skill? This can't be undone.")) await deleteSkillAction(skill!.id); }}>
              <Button type="submit" variant="destructive">Delete</Button>
            </form>
          )}
        </div>
      </form>

      {mode === "edit" && skill && skill.projects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Used by {skill.projects.length} project{skill.projects.length === 1 ? "" : "s"}: {skill.projects.map((p) => p.slug).join(", ")}
        </p>
      )}
    </div>
  );
}
