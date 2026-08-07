import { z } from "zod";

export const mediaTypeSchema = z.enum([
  "IMAGE",
  "VIDEO",
  "PACKET_TRACER",
  "PCAP",
  "PDF",
  "ZIP",
  "OTHER",
]);

const allowedExtensions = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "mp4", "webm", "pkt", "pka",
  "pcap", "pcapng", "pdf", "zip", "cfg", "txt",
]);

export const createMediaSchema = z.object({
  url: z.string().url().refine((value) => {
    const host = new URL(value).hostname;
    return host.endsWith(".public.blob.vercel-storage.com");
  }, "Media URL must be a Vercel Blob public URL"),
  filename: z.string().trim().min(1).max(200).refine(
    (value) => !/[\\/\0]/.test(value) && allowedExtensions.has(value.split(".").pop()?.toLowerCase() ?? ""),
    "Unsupported or unsafe filename"
  ),
  type: mediaTypeSchema,
  size: z.number().int().positive().max(100 * 1024 * 1024, "Files must be 100 MB or smaller"),
}).superRefine((value, context) => {
  if (guessMediaType(value.filename) !== value.type) {
    context.addIssue({ code: "custom", path: ["type"], message: "Media type does not match filename" });
  }
  if (value.type === "IMAGE" && value.size > 10 * 1024 * 1024) {
    context.addIssue({ code: "custom", path: ["size"], message: "Images must be 10 MB or smaller" });
  }
});

export type CreateMediaValues = z.infer<typeof createMediaSchema>;

export function guessMediaType(filename: string): z.infer<typeof mediaTypeSchema> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) return "IMAGE";
  if (["mp4", "webm", "mov"].includes(ext)) return "VIDEO";
  if (ext === "pkt" || ext === "pka") return "PACKET_TRACER";
  if (ext === "pcap" || ext === "pcapng") return "PCAP";
  if (ext === "pdf") return "PDF";
  if (ext === "zip") return "ZIP";
  return "OTHER";
}
