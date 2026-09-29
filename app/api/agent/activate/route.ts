import { NextResponse } from "next/server";
import { activateShop } from "@/lib/shops";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const activationCode = String(body.activationCode || "").trim().toUpperCase();

    if (!activationCode) {
      return NextResponse.json({ ok: false, message: "Activation code is required." }, { status: 400 });
    }

    const shop = await activateShop(activationCode);

    if (!shop || !shop.agentToken) {
      return NextResponse.json({ ok: false, message: "Invalid or already used activation code." }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      shop: {
        id: shop.id,
        slug: shop.slug,
        name: shop.name,
        ownerName: shop.ownerName,
      },
      agentToken: shop.agentToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
