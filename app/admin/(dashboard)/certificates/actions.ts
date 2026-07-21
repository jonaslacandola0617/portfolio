"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createCertificate,
  updateCertificateMetadata,
  updateCertificateContent,
  deleteCertificate,
} from "@/lib/services/certificate-admin-service";
import { certificateFormSchema } from "@/lib/validations/certificate";
import { tiptapDocSchema } from "@/lib/validations/content";
import type { ActionResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    issuer: formData.get("issuer"),
    logo: formData.get("logo"),
    progressStatus: formData.get("progressStatus"),
    publishStatus: formData.get("publishStatus"),
    progressLabel: formData.get("progressLabel"),
    progressPercent: formData.get("progressPercent"),
    skills: (formData.get("skills") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    dateStarted: formData.get("dateStarted"),
    dateCompleted: formData.get("dateCompleted") ?? "",
    credentialUrl: formData.get("credentialUrl") ?? "",
    scheduledFor: formData.get("scheduledFor") ?? "",
  };
}

export async function createCertificateAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = certificateFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  const cert = await createCertificate(parsed.data);
  redirect(`/admin/certificates/${cert.id}`);
}

export async function updateCertificateAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = certificateFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await updateCertificateMetadata(id, parsed.data);
  revalidatePath(`/admin/certificates/${id}`);
  return { success: true, recordId: id };
}

export async function autosaveCertificateContentAction(id: string, content: JSONContent) {
  await requireAdmin();
  const parsed = tiptapDocSchema.safeParse(content);
  if (!parsed.success) throw new Error(`Invalid content: ${parsed.error.message}`);
  await updateCertificateContent(id, parsed.data as JSONContent);
}

export async function deleteCertificateAction(id: string) {
  await requireAdmin();
  await deleteCertificate(id);
  revalidatePath("/admin/certificates");
  redirect("/admin/certificates");
}
