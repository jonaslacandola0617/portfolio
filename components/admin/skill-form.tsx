"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/admin/submit-button";
import { FormMessage } from "@/components/admin/form-message";
import { DeleteButton } from "@/components/admin/delete-button";
import { createSkillAction, updateSkillAction, deleteSkillAction } from "@/app/admin/(dashboard)/skills/actions";
import type { ActionResult } from "@/types/admin";
import { SkillGroupInput } from "@/components/admin/skill-group-input";
import { UNGROUPED_SKILL_GROUP } from "@/lib/skill-groups";

interface SkillFormProps {
  mode: "create" | "edit";
  groups: string[];
  skill?: { id: string; name: string; group: string; level: string; projects: { slug: string }[] };
}

const initialState: ActionResult = { success: false };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-vermilion">{errors[0]}</p>;
}

export function SkillForm({ mode, skill, groups }: SkillFormProps) {
  const router = useRouter();
  const action = mode === "create" ? createSkillAction : updateSkillAction.bind(null, skill!.id);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        {/* This action redirects to /admin/skills?created=1 / ?updated=1
            on success — see components/admin/timeline-form.tsx's comment
            for why only the failure path renders locally. */}
        {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}

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
                <SkillGroupInput groups={groups} defaultValue={skill?.group ?? UNGROUPED_SKILL_GROUP} />
                <FieldError errors={state.errors?.group} />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <select id="level" name="level" defaultValue={skill?.level ?? "learning"} className="flex h-10 w-full border border-border bg-surface px-3 text-sm">
                  <option value="learning">Learning</option>
                  <option value="practiced">Practiced</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
            {mode === "create" ? "Create skill" : "Save changes"}
          </SubmitButton>
          {mode === "edit" && skill && (
            <DeleteButton
              contentType="skill"
              recordTitle={skill.name}
              description={
                skill.projects.length > 0
                  ? `This skill is used by ${skill.projects.length} project${skill.projects.length === 1 ? "" : "s"}. Removing it will detach that shared relationship.`
                  : "This will permanently remove the skill from the CMS."
              }
              onDelete={() => deleteSkillAction(skill.id)}
              onSuccess={() => router.push("/admin/skills")}
            />
          )}
        </div>
      </form>

      {mode === "edit" && skill && skill.projects.length > 0 && (
        <p className="text-sm text-text-dim">
          Used by {skill.projects.length} project{skill.projects.length === 1 ? "" : "s"}: {skill.projects.map((p) => p.slug).join(", ")}
        </p>
      )}
    </div>
  );
}
