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
 * `onUploadCompleted` below is Vercel's server-to-server webhook — it
 * does NOT fire against `localhost` in local dev (Vercel's servers can't
 * reach your machine), so it's a best-effort log here, not the primary
 * way Media rows get created. components/admin/media-upload.tsx calls a
 * dedicated Server Action (createMediaRecordAction) immediately after
 * `upload()` resolves in the browser instead — reliable in every
 * environment, not just a production deploy behind a public URL.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        const policy = getMediaUploadPolicy(pathname);
        return {
          ...policy,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[blob webhook] upload completed (best-effort log):", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[media-upload] Blob upload handler failed:", message);

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
