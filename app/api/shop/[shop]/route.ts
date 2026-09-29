import { NextResponse } from "next/server";
import { getShop } from "@/lib/shops";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await params;
    const record = await getShop(shop);

    if (!record || !record.active) {
      return NextResponse.json({ ok: false, message: "Shop not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      shop: {
        slug: record.slug,
        name: record.name,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Shop information unavailable." }, { status: 503 });
  }
}
