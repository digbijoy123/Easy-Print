import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getShop } from "@/lib/shops";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!clientPayload) throw new Error("Missing upload session.");

        let payload: { shopSlug?: string; sessionId?: string } = {};
        try {
          payload = JSON.parse(clientPayload);
        } catch {
          throw new Error("Invalid upload session.");
        }

        if (!payload.shopSlug || !payload.sessionId) {
          throw new Error("Invalid upload session.");
        }

        const shop = await getShop(payload.shopSlug);
        if (!shop || !shop.active) throw new Error("Shop not found.");

        if (!pathname.startsWith(`incoming/${payload.shopSlug}/${payload.sessionId}/`)) {
          throw new Error("Invalid upload destination.");
        }

        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
