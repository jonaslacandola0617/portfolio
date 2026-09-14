import { z } from "zod";

const MAX_URL_LENGTH = 2048;

function hasAllowedProtocol(value: string, protocols: readonly string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const httpsUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_URL_LENGTH)
  .url()
  .refine((value) => hasAllowedProtocol(value, ["https:"]), "Use an HTTPS URL");

export const safeHrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_URL_LENGTH)
  .refine((value) => {
    if (value.startsWith("#")) return true;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    return hasAllowedProtocol(value, ["https:", "http:", "mailto:", "tel:"]);
  }, "Use an HTTPS/HTTP URL, mailto:, tel:, a local path, or an anchor");

export const publicDocumentUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_URL_LENGTH)
  .refine((value) => {
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    return hasAllowedProtocol(value, ["https:"]);
  }, "Use an HTTPS URL or an absolute local path");

export const vercelPublicBlobUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_URL_LENGTH)
  .refine((value) => {
    if (/^\/case-studies\/[a-z0-9-]+\.png$/i.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.toLowerCase().endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "URL must belong to a public Vercel Blob store or the local case-study screenshot library");

export const profileImageBlobUrlSchema = vercelPublicBlobUrlSchema.refine((value) => {
  if (value.startsWith("/")) return false;
  const pathname = decodeURIComponent(new URL(value).pathname);
  return pathname.startsWith("/profile/") && pathname.length > "/profile/".length;
}, "Profile image must belong to the dedicated profile Blob namespace");
