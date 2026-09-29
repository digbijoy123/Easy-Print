import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createShop } from "@/lib/shops";

function authorized(request: Request) {
  const token = process.env.EASYPRINT_MASTER_ADMIN_TOKEN;
  return Boolean(token) && request.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const ownerName = String(body.ownerName || "").trim();
    const ownerPhone = String(body.ownerPhone || "").trim();

    if (!name) {
      return NextResponse.json({ ok: false, message: "Shop name is required." }, { status: 400 });
    }

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "shop";
    const slug = `${slugBase}-${crypto.randomBytes(3).toString("hex")}`;
    const activationCode = `EP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const agentToken = `epa_${crypto.randomBytes(24).toString("hex")}`;

    const shop = await createShop({
      id: crypto.randomUUID(),
      slug,
      name,
      ownerName,
      ownerPhone,
      activationCode,
      agentToken,
    });

    return NextResponse.json({
      ok: true,
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        customerUrl: `/s/${shop.slug}`,
        activationCode,
        agentToken,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create shop.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
