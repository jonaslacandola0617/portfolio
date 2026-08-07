"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import { createSkill, updateSkill, deleteSkill, deleteSkills, updateSkillGroup } from "@/lib/services/skill-admin-service";
import { skillFormSchema, updateSkillGroupSchema } from "@/lib/validations/skill";
import { bulkDeleteSchema, deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import type { ActionResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    group: formData.get("group") || undefined,
    level: formData.get("level"),
  };
}

export async function updateSkillGroupAction(input: {
  id: string;
  group: string;
}): Promise<ActionResult & { group?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, code: "AUTH_ERROR", message: "Your admin session expired. Sign in again." };
  }
  const parsed = updateSkillGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR", message: "Choose a valid Skill group." };
  }
  try {
    const skill = await updateSkillGroup(parsed.data.id, parsed.data.group);
    return { success: true, recordId: skill.id, group: skill.group, message: `Moved to ${skill.group}.` };
  } catch (error) {
    return classifyServiceError(error, {
      operation: "update-group",
      contentType: "skill",
      recordId: parsed.data.id,
    });
  }
}

export async function createSkillAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = skillFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await createSkill(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "create", contentType: "skill" });
  }
  redirect("/admin/skills?created=1");
}

export async function updateSkillAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = skillFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateSkill(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "skill", recordId: id });
  }
  redirect("/admin/skills?updated=1");
}

export async function deleteSkillAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid skill id." };
  try {
    await deleteSkill(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "skill", recordId: parsed.data });
  }
  return { success: true };
}

export async function bulkDeleteSkillsAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };

  let deletedCount: number;
  try {
    deletedCount = await deleteSkills(parsed.data.ids);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "bulkDelete", contentType: "skill" });
  }

  return { success: true, deletedCount };
}
