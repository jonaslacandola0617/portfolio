"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/services/auth-service";
import { prisma } from "@/lib/db";
import { createMediaSchema, type CreateMediaValues } from "@/lib/validations/media";

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
  try {
    return (await prisma.media.findMany({ orderBy: { uploadedAt: "desc" } })) as AdminMediaItem[];
  } catch (error) {
    console.error("[media-admin-service] getAllMedia failed:", error);
    return [];
  }
}

export async function createMediaRecordAction(values: CreateMediaValues) {
  await requireAdmin();
  const parsed = createMediaSchema.safeParse(values);
  if (!parsed.success) throw new Error(`Invalid media record: ${parsed.error.message}`);

  const media = await prisma.media.create({ data: parsed.data });
  revalidatePath("/admin/media");
  return media;
}

export async function deleteMediaAction(id: string) {
  await requireAdmin();
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;

  try {
    await del(media.url);
  } catch (error) {
    console.error("[media-admin-service] Failed to delete blob (deleting DB row anyway):", error);
  }

  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
