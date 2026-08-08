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

export const vercelPublicBlobUrlSchema = httpsUrlSchema.refine((value) => {
  const hostname = new URL(value).hostname.toLowerCase();
  return hostname.endsWith(".public.blob.vercel-storage.com");
}, "URL must belong to a public Vercel Blob store");

export const profileImageBlobUrlSchema = vercelPublicBlobUrlSchema.refine((value) => {
  const pathname = decodeURIComponent(new URL(value).pathname);
  return pathname.startsWith("/profile/") && pathname.length > "/profile/".length;
}, "Profile image must belong to the dedicated profile Blob namespace");
