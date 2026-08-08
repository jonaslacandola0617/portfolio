import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/auth-service";

const MAX_PROFILE_BYTES = 5 * 1024 * 1024;
const profileContentTypes: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
};

function profileUploadPolicy(pathname: string) {
  if (!pathname.startsWith("profile/")) {
    throw new Error("Profile uploads must use the dedicated profile namespace.");
  }

  const filename = pathname.slice("profile/".length).trim();
  if (!filename || filename.length > 200 || filename.includes("/") || /[\\\0]/.test(filename)) {
    throw new Error("Unsafe profile image pathname.");
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const allowedContentTypes = profileContentTypes[extension];
  if (!allowedContentTypes) {
    throw new Error("Profile images must be JPEG, PNG, or WebP.");
  }

  return { allowedContentTypes, maximumSizeInBytes: MAX_PROFILE_BYTES };
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        const policy = profileUploadPolicy(pathname);
        return {
          ...policy,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[about-profile] upload completed:", blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profile image upload failed" },
      { status: 400 },
    );
  }
}
