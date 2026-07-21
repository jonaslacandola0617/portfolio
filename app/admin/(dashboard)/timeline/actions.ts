"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import { createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } from "@/lib/services/timeline-admin-service";
import { timelineFormSchema } from "@/lib/validations/timeline";
import type { ActionResult } from "@/types/admin";

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
  await createTimelineEntry(parsed.data);
  redirect("/admin/timeline");
}

export async function updateTimelineAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = timelineFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await updateTimelineEntry(id, parsed.data);
  redirect("/admin/timeline");
}

export async function deleteTimelineAction(id: string) {
  await requireAdmin();
  await deleteTimelineEntry(id);
  revalidatePath("/admin/timeline");
  redirect("/admin/timeline");
}
