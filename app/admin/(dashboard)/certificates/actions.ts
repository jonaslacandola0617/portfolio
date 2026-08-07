"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createCertificate,
  updateCertificateMetadata,
  updateCertificateContent,
  deleteCertificate,
  deleteCertificates,
  reorderCertificates,
} from "@/lib/services/certificate-admin-service";
import { certificateFormSchema } from "@/lib/validations/certificate";
import { bulkDeleteSchema, deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import { saveEditorContent } from "@/lib/services/content-save-service";
import type { ActionResult, SaveContentPayload, SaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    issuer: formData.get("issuer"),
    logoMediaId: formData.get("logoMediaId") ?? "",
    publishStatus: formData.get("publishStatus"),
    skills: (formData.get("skills") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    dateStarted: formData.get("dateStarted") ?? "",
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
  try {
    await requireAdmin();
  } catch {
    console.error("[admin:certificate:update] authentication failed", {
      contentType: "certificate",
      recordId: id,
      operation: "metadata-save",
      validationStage: "authentication",
    });
    return { success: false, code: "AUTH_ERROR", message: "Your admin session expired. Sign in again." };
  }
  const parsed = certificateFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    console.error("[admin:certificate:update] validation failed", {
      contentType: "certificate",
      recordId: id,
      operation: "metadata-save",
      validationStage: "server-zod",
      fields: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateCertificateMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "certificate", recordId: id });
  }

  return { success: true, recordId: id, message: "Metadata changes saved." };
}

export async function autosaveCertificateContentAction(payload: SaveContentPayload): Promise<SaveResult> {
  return saveEditorContent("certificate", payload, updateCertificateContent);
}

export async function reorderCertificatesAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid certificate order." };
  }

  try {
    await reorderCertificates(parsed.data.ids);
    return { success: true, message: "Certificate order saved." };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "certificate" });
  }
}

export async function deleteCertificateAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid certificate id." };
  try {
    await deleteCertificate(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "certificate", recordId: parsed.data });
  }
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

  return { success: true, deletedCount };
}
