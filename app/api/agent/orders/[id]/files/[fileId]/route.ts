import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agentAuth";
import { getOrder } from "@/lib/orders";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const shop = await authenticateAgent(request);
  if (!shop) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  const { id, fileId } = await params;
  const order = await getOrder(id, shop.slug);
  const file = order?.files.find((item) => item.id === fileId);

  if (!order || !file) {
    return NextResponse.json({ ok: false, message: "File not found." }, { status: 404 });
  }

  try {
    const result = await get(file.pathname, { access: "private" });
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
