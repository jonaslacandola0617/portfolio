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

function serializeMedia<T extends { uploadedAt: Date; type: unknown }>(media: T) {
  return {
    ...media,
    type: String(media.type),
    uploadedAt: media.uploadedAt.toISOString(),
  };
}

export async function getAllMedia(): Promise<AdminMediaItem[]> {
  await requireAdmin();
  const media = await prisma.media.findMany({ orderBy: { uploadedAt: "desc" } });
  return media.map((item) => serializeMedia(item));
}

export async function createMediaRecordAction(values: CreateMediaValues) {
  await requireAdmin();
  const parsed = createMediaSchema.safeParse(values);
  if (!parsed.success) throw new Error(`Invalid media record: ${parsed.error.message}`);

  // Client uploads can be retried after a slow network/server response. Returning
  // an existing row for the same immutable Blob URL keeps that retry safe without
  // requiring a schema migration just for upload recovery.
  const existing = await prisma.media.findFirst({ where: { url: parsed.data.url } });
  if (existing) return serializeMedia(existing);

  const media = await prisma.media.create({ data: parsed.data });

  // Do not revalidate /admin/media here. The upload client already refreshes the
  // route after this action returns. Keeping revalidation out of this latency-
  // sensitive action avoids making a successful DB write wait on route invalidation.
  return serializeMedia(media);
}

export async function deleteMediaAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid media id." };

  try {
    const media = await prisma.media.findUnique({ where: { id: parsed.data } });
    if (!media) return { success: false, message: "That media file no longer exists." };
    const [downloadReferences, thumbnailReferences, certificateLogoReferences, projects, labs, articles, certificates] = await Promise.all([
      prisma.download.count({ where: { mediaId: parsed.data } }),
      prisma.project.count({ where: { thumbnailId: parsed.data } }),
      prisma.certificate.count({ where: { logoMediaId: parsed.data } }),
      prisma.project.findMany({ select: { content: true } }),
      prisma.lab.findMany({ select: { content: true } }),
      prisma.article.findMany({ select: { content: true } }),
      prisma.certificate.findMany({ select: { content: true } }),
    ]);
    const editorReferences = [...projects, ...labs, ...articles, ...certificates]
      .some((record) => referencesMedia(record.content, parsed.data));
    if (downloadReferences > 0 || thumbnailReferences > 0 || certificateLogoReferences > 0 || editorReferences) {
      return {
        success: false,
        message: "Remove this file from certificate logos, thumbnails, editor content, and Lab or Project resources before deleting it.",
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
