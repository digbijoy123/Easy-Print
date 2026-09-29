import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agentAuth";
import { listQueuedOrders } from "@/lib/orders";

export async function GET(request: Request) {
  const shop = await authenticateAgent(request);
  if (!shop) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const requestedShop = new URL(request.url).searchParams.get("shop");
    if (requestedShop && requestedShop !== shop.slug) {
      return NextResponse.json({ ok: false, message: "Shop mismatch." }, { status: 403 });
    }

    const orders = await listQueuedOrders(shop.slug);
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent queue unavailable.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
