import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/auth-service";
import { getMediaUploadPolicy } from "@/lib/validations/media";

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
 * Media rows are created by createMediaRecordAction after the browser's
 * direct Blob transfer resolves. This route intentionally does not register
 * an onUploadCompleted webhook: it was only logging a storage-side event,
 * which could be mistaken for confirmation that the browser promise or the
 * subsequent database mutation had completed.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        const policy = getMediaUploadPolicy(pathname);
        console.info("[media-upload] token issued", {
          operation: "authorize",
          filename: pathname,
        });
        return {
          ...policy,
          addRandomSuffix: true,
        };
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
