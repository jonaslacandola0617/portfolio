"use client";

import { put, type HandleUploadBody } from "@vercel/blob/client";

interface ClientTokenResponse {
  type: "blob.generate-client-token";
  clientToken: string;
}

function isClientTokenResponse(value: unknown): value is ClientTokenResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === "blob.generate-client-token" &&
    typeof record.clientToken === "string" &&
    record.clientToken.startsWith("vercel_blob_client_")
  );
}

async function readUploadError(response: Response): Promise<string> {
  try {
    const value = (await response.json()) as unknown;
    if (value && typeof value === "object") {
      const error = (value as Record<string, unknown>).error;
      if (typeof error === "string" && error.trim()) return error;
    }
  } catch {
    // A non-JSON proxy response should still produce a safe client message.
  }
  return "The upload could not be authorized. Please try again.";
}

/**
 * Request the short-lived upload token and transfer the file as two explicit
 * operations. The combined Blob `upload()` helper enables request-stream based
 * progress tracking in supported browsers. Production traces showed that the
 * browser could remain in that transfer promise even though a server-side Blob
 * completion log appeared. A normal Blob-body PUT avoids that streaming branch
 * while preserving Vercel's direct-to-Blob architecture and security policy.
 */
export async function uploadMediaFile(
  file: File,
  signal: AbortSignal,
  onStage: (stage: "authorizing" | "uploading") => void,
) {
  onStage("authorizing");
  const event: HandleUploadBody = {
    type: "blob.generate-client-token",
    payload: {
      pathname: file.name,
      clientPayload: null,
      multipart: false,
    },
  };

  const tokenResponse = await fetch("/api/admin/media/upload", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
    signal,
  });

  if (!tokenResponse.ok) {
    throw new Error(await readUploadError(tokenResponse));
  }

  const tokenPayload = (await tokenResponse.json()) as unknown;
  if (!isClientTokenResponse(tokenPayload)) {
    throw new Error("The upload service returned an invalid authorization response.");
  }

  onStage("uploading");
  return put(file.name, file, {
    access: "public",
    token: tokenPayload.clientToken,
    contentType: file.type || undefined,
    abortSignal: signal,
  });
}
