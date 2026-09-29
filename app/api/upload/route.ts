import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!clientPayload) {
          throw new Error("Missing upload session.");
        }

        let payload: { shopSlug?: string; sessionId?: string } = {};
        try {
          payload = JSON.parse(clientPayload);
        } catch {
          throw new Error("Invalid upload session.");
        }

        if (!payload.shopSlug || !payload.sessionId) {
          throw new Error("Invalid upload session.");
        }

        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async () => {
        // The file is intentionally kept private and temporary until the
        // associated order is completed. The order completion endpoint
        // deletes the object from Blob storage.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
