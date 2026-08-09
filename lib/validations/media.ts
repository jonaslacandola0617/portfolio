import { z } from "zod";
import { vercelPublicBlobUrlSchema } from "@/lib/validations/url";

export const mediaTypeSchema = z.enum([
  "IMAGE",
  "VIDEO",
  "PACKET_TRACER",
  "PCAP",
  "PDF",
  "ZIP",
  "OTHER",
]);

export const MEDIA_MAX_BYTES = 100 * 1024 * 1024;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const allowedExtensions = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "mp4", "webm", "pkt", "pka",
  "pcap", "pcapng", "pdf", "zip", "cfg", "txt",
]);

const contentTypesByExtension: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  mp4: ["video/mp4"],
  webm: ["video/webm"],
  pkt: ["application/octet-stream"],
  pka: ["application/octet-stream"],
  pcap: ["application/vnd.tcpdump.pcap", "application/octet-stream"],
  pcapng: ["application/vnd.tcpdump.pcap", "application/octet-stream"],
  pdf: ["application/pdf"],
  zip: ["application/zip", "application/x-zip-compressed"],
  cfg: ["text/plain", "application/octet-stream"],
  txt: ["text/plain"],
};

function extensionOf(value: string): string {
  return value.split(".").pop()?.toLowerCase() ?? "";
}

export function createMediaUploadPath(uploadId: string, filename: string): string {
  return `media-${uploadId}.${extensionOf(filename)}`;
}

export function getMediaUploadPolicy(pathname: string) {
  const filename = pathname.trim();
  if (
    !filename ||
    filename.length > 200 ||
    filename.includes("/") ||
    /[\\\0]/.test(filename)
  ) {
    throw new Error("Unsafe media pathname.");
  }

  const extension = extensionOf(filename);
  if (!allowedExtensions.has(extension)) {
    throw new Error("Unsupported media file extension.");
  }

  return {
    allowedContentTypes: contentTypesByExtension[extension] ?? ["application/octet-stream"],
    maximumSizeInBytes:
      guessMediaType(filename) === "IMAGE" ? IMAGE_MAX_BYTES : MEDIA_MAX_BYTES,
  };
}

export const createMediaSchema = z.object({
  url: vercelPublicBlobUrlSchema,
  filename: z.string().trim().min(1).max(200).refine(
    (value) => !/[\\/\0]/.test(value) && allowedExtensions.has(extensionOf(value)),
    "Unsupported or unsafe filename"
  ),
  type: mediaTypeSchema,
  size: z.number().int().positive().max(MEDIA_MAX_BYTES, "Files must be 100 MB or smaller"),
}).superRefine((value, context) => {
  if (guessMediaType(value.filename) !== value.type) {
    context.addIssue({ code: "custom", path: ["type"], message: "Media type does not match filename" });
  }
  if (value.type === "IMAGE" && value.size > IMAGE_MAX_BYTES) {
    context.addIssue({ code: "custom", path: ["size"], message: "Images must be 10 MB or smaller" });
  }

  const blobExtension = extensionOf(decodeURIComponent(new URL(value.url).pathname));
  const filenameExtension = extensionOf(value.filename);
  if (blobExtension !== filenameExtension) {
    context.addIssue({
      code: "custom",
      path: ["url"],
      message: "Blob URL extension does not match the uploaded filename",
    });
  }
});

export type CreateMediaValues = z.infer<typeof createMediaSchema>;

export const mediaUploadPayloadSchema = z.object({
  uploadId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200).refine(
    (value) => !/[\\/\0]/.test(value) && allowedExtensions.has(extensionOf(value)),
    "Unsupported or unsafe filename"
  ),
  type: mediaTypeSchema,
  size: z.number().int().positive().max(MEDIA_MAX_BYTES),
}).superRefine((value, context) => {
  if (guessMediaType(value.filename) !== value.type) {
    context.addIssue({ code: "custom", path: ["type"], message: "Media type does not match filename" });
  }
  if (value.type === "IMAGE" && value.size > IMAGE_MAX_BYTES) {
    context.addIssue({ code: "custom", path: ["size"], message: "Images must be 10 MB or smaller" });
  }
});

export type MediaUploadPayload = z.infer<typeof mediaUploadPayloadSchema>;

export function guessMediaType(filename: string): z.infer<typeof mediaTypeSchema> {
  const ext = extensionOf(filename);
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "IMAGE";
  if (["mp4", "webm"].includes(ext)) return "VIDEO";
  if (ext === "pkt" || ext === "pka") return "PACKET_TRACER";
  if (ext === "pcap" || ext === "pcapng") return "PCAP";
  if (ext === "pdf") return "PDF";
  if (ext === "zip") return "ZIP";
  return "OTHER";
}
