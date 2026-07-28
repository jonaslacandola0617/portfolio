"use server";

import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/services/auth-service";
import { prisma } from "@/lib/db";
import { createMediaSchema, type CreateMediaValues } from "@/lib/validations/media";
import { deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError } from "@/lib/services/action-errors";
import type { DeleteResult } from "@/types/admin";
import { revalidateContent } from "@/lib/services/content-revalidation";

interface AdminMediaItem {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export async function getAllMedia(): Promise<AdminMediaItem[]> {
  await requireAdmin();
  return (await prisma.media.findMany({ orderBy: { uploadedAt: "desc" } })) as AdminMediaItem[];
}

export async function createMediaRecordAction(values: CreateMediaValues) {
  await requireAdmin();
  const parsed = createMediaSchema.safeParse(values);
  if (!parsed.success) throw new Error(`Invalid media record: ${parsed.error.message}`);

  const media = await prisma.media.create({ data: parsed.data });
  revalidateContent("media");
  return media;
}

export async function deleteMediaAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid media id." };

  try {
    const media = await prisma.media.findUnique({ where: { id: parsed.data } });
    if (!media) return { success: false, message: "That media file no longer exists." };
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
