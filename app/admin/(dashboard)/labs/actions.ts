"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireAdmin } from "@/lib/services/auth-service";
import { createLab, updateLabMetadata, updateLabContent, deleteLab } from "@/lib/services/lab-admin-service";
import { labFormSchema, labContentSchema } from "@/lib/validations/lab";
import type { ActionResult } from "@/types/admin";

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
  const lab = await createLab(parsed.data);
  redirect(`/admin/labs/${lab.id}`);
}

export async function updateLabAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = labFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await updateLabMetadata(id, parsed.data);
  revalidatePath(`/admin/labs/${id}`);
  return { success: true, recordId: id };
}

export async function autosaveLabContentAction(id: string, content: JSONContent) {
  await requireAdmin();
  const parsed = labContentSchema.safeParse(content);
  if (!parsed.success) throw new Error(`Invalid content: ${parsed.error.message}`);
  await updateLabContent(id, parsed.data as JSONContent);
}

export async function deleteLabAction(id: string) {
  await requireAdmin();
  await deleteLab(id);
  revalidatePath("/admin/labs");
  redirect("/admin/labs");
}
