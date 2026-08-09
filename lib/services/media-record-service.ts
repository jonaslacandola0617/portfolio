import "server-only";

import { prisma } from "@/lib/db";
import { createMediaSchema, type CreateMediaValues } from "@/lib/validations/media";

export async function createMediaRecord(values: CreateMediaValues) {
  const parsed = createMediaSchema.safeParse(values);
  if (!parsed.success) {
    console.warn("[media-upload] media record validation failed", {
      operation: "create",
      contentType: "media",
      filename: values.filename,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
      })),
    });
    throw new Error("The uploaded file metadata was not valid.");
  }

  try {
    const existing = await prisma.media.findFirst({ where: { url: parsed.data.url } });
    if (existing) {
      console.info("[media-upload] existing media record returned", {
        operation: "create",
        contentType: "media",
        recordId: existing.id,
      });
      return existing;
    }

    const media = await prisma.media.create({ data: parsed.data });
    console.info("[media-upload] media record created", {
      operation: "create",
      contentType: "media",
      recordId: media.id,
    });
    return media;
  } catch (error) {
    const prismaCode =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
    console.error("[media-upload] media record creation failed", {
      operation: "create",
      contentType: "media",
      filename: parsed.data.filename,
      prismaCode,
    });
    throw new Error("The Media Library record could not be saved.");
  }
}
