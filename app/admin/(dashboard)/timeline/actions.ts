"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  deleteTimelineEntries,
} from "@/lib/services/timeline-admin-service";
import { timelineFormSchema } from "@/lib/validations/timeline";
import { bulkDeleteSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import type { ActionResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    category: formData.get("category"),
    publishStatus: formData.get("publishStatus"),
    tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    scheduledFor: formData.get("scheduledFor") ?? "",
  };
}

export async function createTimelineAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = timelineFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await createTimelineEntry(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "create", contentType: "timeline entry" });
  }
  redirect("/admin/timeline?created=1");
}

export async function updateTimelineAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = timelineFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateTimelineEntry(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "timeline entry", recordId: id });
  }
  redirect("/admin/timeline?updated=1");
}

export async function deleteTimelineAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  try {
    await deleteTimelineEntry(id);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "timeline entry", recordId: id });
  }
  revalidatePath("/admin/timeline");
  revalidatePath("/timeline");
  return { success: true };
}

export async function bulkDeleteTimelineAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };

  let deletedCount: number;
  try {
    deletedCount = await deleteTimelineEntries(parsed.data.ids);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "bulkDelete", contentType: "timeline entry" });
  }

  revalidatePath("/admin/timeline");
  revalidatePath("/timeline");
  return { success: true, deletedCount };
}
