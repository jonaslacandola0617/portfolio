"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createLab,
  updateLabMetadata,
  updateLabContent,
  deleteLab,
  deleteLabs,
} from "@/lib/services/lab-admin-service";
import { labFormSchema } from "@/lib/validations/lab";
import { bulkDeleteSchema, deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import { saveEditorContent } from "@/lib/services/content-save-service";
import type { ActionResult, SaveContentPayload, SaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

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
  try {
    await requireAdmin();
  } catch {
    console.error("[admin:lab:update] authentication failed", {
      contentType: "lab",
      recordId: id,
      operation: "metadata-save",
      validationStage: "authentication",
    });
    return { success: false, code: "AUTH_ERROR", message: "Your admin session expired. Sign in again." };
  }
  const parsed = labFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    console.error("[admin:lab:update] validation failed", {
      contentType: "lab",
      recordId: id,
      operation: "metadata-save",
      validationStage: "server-zod",
      fields: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateLabMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "lab", recordId: id });
  }

  return { success: true, recordId: id, message: "Metadata changes saved." };
}

export async function autosaveLabContentAction(payload: SaveContentPayload): Promise<SaveResult> {
  return saveEditorContent("lab", payload, updateLabContent);
}

export async function deleteLabAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid lab id." };
  try {
    await deleteLab(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "lab", recordId: parsed.data });
  }
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

  return { success: true, deletedCount };
}
