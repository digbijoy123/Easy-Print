import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createShop } from "@/lib/shops";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const ownerName = String(body.ownerName || "").trim();
    const ownerPhone = String(body.ownerPhone || "").trim();

    if (!name || !ownerPhone) {
      return NextResponse.json(
        { ok: false, message: "Shop name and phone number are required." },
        { status: 400 }
      );
    }

    const shop = await createShop({
      id: crypto.randomUUID(),
      slug: `ep-${crypto.randomBytes(6).toString("hex")}`,
      name,
      ownerName,
      ownerPhone,
    });

    return NextResponse.json({
      ok: true,
      shop: {
        id: shop.id,
        slug: shop.slug,
        name: shop.name,
        ownerName: shop.ownerName,
        ownerPhone: shop.ownerPhone,
        activationCode: shop.activationCode,
        customerUrl: `/s/${shop.slug}`,
      },
      agentToken: shop.agentToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not register shop.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
