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
  deleteCertificates,
} from "@/lib/services/certificate-admin-service";
import { certificateFormSchema } from "@/lib/validations/certificate";
import { tiptapDocSchema } from "@/lib/validations/content";
import { bulkDeleteSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import type { ActionResult, AutosaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

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

  let cert;
  try {
    cert = await createCertificate(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "create", contentType: "certificate" });
  }
  redirect(`/admin/certificates/${cert.id}?created=1`);
}

export async function updateCertificateAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = certificateFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateCertificateMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "certificate", recordId: id });
  }

  revalidatePath(`/admin/certificates/${id}`);
  return { success: true, recordId: id, message: "Changes saved." };
}

export async function autosaveCertificateContentAction(id: string, content: JSONContent): Promise<AutosaveResult> {
  await requireAdmin();
  const parsed = tiptapDocSchema.safeParse(content);
  if (!parsed.success) {
    console.error("[admin:certificate:autosave] content failed validation", {
      recordId: id,
      issues: parsed.error.issues,
    });
    return {
      success: false,
      message: "This content couldn't be saved — it contains something the editor doesn't recognize.",
      code: "INVALID_CONTENT",
    };
  }

  try {
    await updateCertificateContent(id, parsed.data as JSONContent);
  } catch (error) {
    const result = classifyServiceError(error, { operation: "autosave", contentType: "certificate", recordId: id });
    return { success: false, message: result.message, code: result.code };
  }

  return { success: true, savedAt: new Date().toISOString() };
}

export async function deleteCertificateAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  try {
    await deleteCertificate(id);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "certificate", recordId: id });
  }
  revalidatePath("/admin/certificates");
  revalidatePath("/certifications");
  revalidatePath("/");
  return { success: true };
}

export async function bulkDeleteCertificatesAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };

  let deletedCount: number;
  try {
    deletedCount = await deleteCertificates(parsed.data.ids);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "bulkDelete", contentType: "certificate" });
  }

  revalidatePath("/admin/certificates");
  revalidatePath("/certifications");
  revalidatePath("/");
  return { success: true, deletedCount };
}
