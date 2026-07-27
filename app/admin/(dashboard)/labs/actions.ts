"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createLab,
  updateLabMetadata,
  updateLabContent,
  deleteLab,
  deleteLabs,
} from "@/lib/services/lab-admin-service";
import { labFormSchema, labContentSchema } from "@/lib/validations/lab";
import { bulkDeleteSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import type { ActionResult, AutosaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    purpose: formData.get("purpose"),
    category: formData.get("category"),
    difficulty: formData.get("difficulty"),
    progressStatus: formData.get("progressStatus"),
    publishStatus: formData.get("publishStatus"),
    tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    labDate: formData.get("labDate"),
    scheduledFor: formData.get("scheduledFor") ?? "",
  };
}

export async function createLabAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = labFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  let lab;
  try {
    lab = await createLab(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "create", contentType: "lab" });
  }
  redirect(`/admin/labs/${lab.id}?created=1`);
}

export async function updateLabAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = labFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateLabMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "lab", recordId: id });
  }

  revalidatePath(`/admin/labs/${id}`);
  return { success: true, recordId: id, message: "Changes saved." };
}

export async function autosaveLabContentAction(id: string, content: JSONContent): Promise<AutosaveResult> {
  await requireAdmin();
  const parsed = labContentSchema.safeParse(content);
  if (!parsed.success) {
    console.error("[admin:lab:autosave] content failed validation", { recordId: id, issues: parsed.error.issues });
    return {
      success: false,
      message: "This content couldn't be saved — it contains something the editor doesn't recognize.",
      code: "INVALID_CONTENT",
    };
  }

  try {
    await updateLabContent(id, parsed.data as JSONContent);
  } catch (error) {
    const result = classifyServiceError(error, { operation: "autosave", contentType: "lab", recordId: id });
    return { success: false, message: result.message, code: result.code };
  }

  return { success: true, savedAt: new Date().toISOString() };
}

export async function deleteLabAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  try {
    await deleteLab(id);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "lab", recordId: id });
  }
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  revalidatePath("/");
  return { success: true };
}

export async function bulkDeleteLabsAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };

  let deletedCount: number;
  try {
    deletedCount = await deleteLabs(parsed.data.ids);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "bulkDelete", contentType: "lab" });
  }

  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  revalidatePath("/");
  return { success: true, deletedCount };
}
