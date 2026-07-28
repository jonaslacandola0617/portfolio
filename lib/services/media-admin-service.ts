"use server";

import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/services/auth-service";
import { prisma } from "@/lib/db";
import { createMediaSchema, type CreateMediaValues } from "@/lib/validations/media";
import { deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError } from "@/lib/services/action-errors";
import type { DeleteResult } from "@/types/admin";
import { revalidateContent } from "@/lib/services/content-revalidation";

export interface AdminMediaItem {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: string;
}

function referencesMedia(value: unknown, mediaId: string): boolean {
  if (Array.isArray(value)) return value.some((item) => referencesMedia(item, mediaId));
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.mediaId === mediaId) return true;
  return Object.values(record).some((item) => referencesMedia(item, mediaId));
}

export async function getAllMedia(): Promise<AdminMediaItem[]> {
  await requireAdmin();
  const media = await prisma.media.findMany({ orderBy: { uploadedAt: "desc" } });
  return media.map((item) => ({ ...item, type: item.type, uploadedAt: item.uploadedAt.toISOString() }));
}

export async function createMediaRecordAction(values: CreateMediaValues) {
  await requireAdmin();
  const parsed = createMediaSchema.safeParse(values);
  if (!parsed.success) throw new Error(`Invalid media record: ${parsed.error.message}`);

  const media = await prisma.media.create({ data: parsed.data });
  revalidateContent("media");
  return { ...media, type: media.type, uploadedAt: media.uploadedAt.toISOString() };
}

export async function deleteMediaAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid media id." };

  try {
    const media = await prisma.media.findUnique({ where: { id: parsed.data } });
    if (!media) return { success: false, message: "That media file no longer exists." };
    const [downloadReferences, thumbnailReferences, projects, labs, articles, certificates] = await Promise.all([
      prisma.download.count({ where: { mediaId: parsed.data } }),
      prisma.project.count({ where: { thumbnailId: parsed.data } }),
      prisma.project.findMany({ select: { content: true } }),
      prisma.lab.findMany({ select: { content: true } }),
      prisma.article.findMany({ select: { content: true } }),
      prisma.certificate.findMany({ select: { content: true } }),
    ]);
    const editorReferences = [...projects, ...labs, ...articles, ...certificates]
      .some((record) => referencesMedia(record.content, parsed.data));
    if (downloadReferences > 0 || thumbnailReferences > 0 || editorReferences) {
      return {
        success: false,
        message: "Remove this file from thumbnails, editor content, and Lab or Project resources before deleting it.",
      };
    }
    await del(media.url);
    await prisma.media.delete({ where: { id: parsed.data } });
  } catch (error) {
    return classifyServiceError(error, {
      operation: "delete",
      contentType: "media",
      recordId: parsed.data,
    });
  }
  revalidateContent("media");
  return { success: true };
}
