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

export const createMediaSchema = z.object({
  url: z.string().url(),
  filename: z.string().min(1),
  type: mediaTypeSchema,
  size: z.number().int().positive(),
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
