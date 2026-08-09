import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/auth-service";
import { createMediaRecord } from "@/lib/services/media-record-service";
import {
  createMediaUploadPath,
  getMediaUploadPolicy,
  mediaUploadPayloadSchema,
} from "@/lib/validations/media";

/**
 * The one legitimate exception to "Server Actions over API routes"
 * (ARCHITECTURE.md rule #4) that Phase 4's report predicted would land
 * here. Vercel Blob's client-direct-upload pattern needs a route the
 * browser can exchange for a short-lived signed token before uploading
 * straight to Blob storage — bypassing this server entirely for the
 * actual file bytes, which matters because Vercel Functions cap request
 * bodies at ~4.5 MB and PCAP/Packet Tracer/video files routinely exceed
 * that.
 *
 * Security-sensitive file policy is enforced here, before bytes are sent
 * to Blob, and then validated again when the Media row is created. This
 * prevents oversized/unsupported orphan Blobs if a caller obtains a token
 * but never completes the database-record step.
 *
 * Media Library uploads include validated metadata in the short-lived token.
 * Vercel's signed completion callback persists that metadata after storage
 * confirms the Blob, so database completion does not depend on the browser's
 * direct PUT response settling.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireAdmin();
        const policy = getMediaUploadPolicy(pathname);

        let tokenPayload: string | undefined;
        if (clientPayload) {
          const payload = mediaUploadPayloadSchema.safeParse(JSON.parse(clientPayload));
          if (!payload.success) throw new Error("Invalid Media Library upload metadata.");
          if (pathname !== createMediaUploadPath(payload.data.uploadId, payload.data.filename)) {
            throw new Error("Media upload pathname does not match its metadata.");
          }
          tokenPayload = JSON.stringify(payload.data);
        }

        console.info("[media-upload] token issued", {
          operation: "authorize",
          pathname,
        });
        return {
          ...policy,
          addRandomSuffix: true,
          tokenPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const payload = mediaUploadPayloadSchema.safeParse(JSON.parse(tokenPayload));
        if (!payload.success) throw new Error("Invalid Media Library completion metadata.");

        console.info("[media-upload] storage completion received", {
          operation: "complete",
          contentType: "media",
          uploadId: payload.data.uploadId,
        });
        await createMediaRecord({
          url: blob.url,
          filename: payload.data.filename,
          type: payload.data.type,
          size: payload.data.size,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
