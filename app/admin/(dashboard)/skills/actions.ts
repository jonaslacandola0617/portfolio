"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import { createSkill, updateSkill, deleteSkill } from "@/lib/services/skill-admin-service";
import { skillFormSchema } from "@/lib/validations/skill";
import type { ActionResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    group: formData.get("group"),
    level: formData.get("level"),
  };
}

export async function createSkillAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = skillFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await createSkill(parsed.data);
  redirect("/admin/skills");
}

export async function updateSkillAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = skillFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await updateSkill(id, parsed.data);
  redirect("/admin/skills");
}

export async function deleteSkillAction(id: string) {
  await requireAdmin();
  await deleteSkill(id);
  revalidatePath("/admin/skills");
  redirect("/admin/skills");
}
