"use server";

import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/services/auth-service";
import { prisma } from "@/lib/db";
import { type CreateMediaValues } from "@/lib/validations/media";
import { deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError } from "@/lib/services/action-errors";
import type { DeleteResult } from "@/types/admin";
import { revalidateContent } from "@/lib/services/content-revalidation";
import { createMediaRecord } from "@/lib/services/media-record-service";
import { z } from "zod";

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
  console.info("[media-upload] media record requested", {
    operation: "create",
    contentType: "media",
    filename: values.filename,
  });
  return serializeMedia(await createMediaRecord(values));
}

const mediaUploadIdSchema = z.string().uuid();

export type MediaUploadStatusResult =
  | { success: true; media: AdminMediaItem | null }
  | { success: false; message: string };

export async function getMediaUploadStatusAction(
  uploadId: string,
): Promise<MediaUploadStatusResult> {
  await requireAdmin();
  const parsed = mediaUploadIdSchema.safeParse(uploadId);
  if (!parsed.success) return { success: false, message: "Invalid upload identifier." };

  try {
    const media = await prisma.media.findFirst({
      where: { url: { contains: `media-${parsed.data}` } },
    });
    return { success: true, media: media ? serializeMedia(media) : null };
  } catch (error) {
    const prismaCode =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
    console.error("[media-upload] completion check failed", {
      operation: "read-completion",
      contentType: "media",
      uploadId: parsed.data,
      prismaCode,
    });
    return { success: false, message: "Media Library confirmation is temporarily unavailable." };
  }
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
