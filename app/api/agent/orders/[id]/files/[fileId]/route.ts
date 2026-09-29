import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

function authorized(request: Request) {
  const token = process.env.EASYPRINT_AGENT_TOKEN;
  return Boolean(token) && request.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id, fileId } = await params;
  const order = await getOrder(id);
  const file = order?.files.find((item) => item.id === fileId);

  if (!order || !file) {
    return NextResponse.json({ ok: false, message: "File not found." }, { status: 404 });
  }

  try {
    const result = await get(file.pathname, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ ok: false, message: "Stored file is unavailable." }, { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || file.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.name.replace(/["\\]/g, "_")}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Stored file is unavailable." }, { status: 404 });
  }
}
