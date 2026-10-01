import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agentAuth";
import { getOrder, updateOrderStatus } from "@/lib/orders";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const shop = await authenticateAgent(request);
  if (!shop) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const existing = await getOrder(id, shop.slug);
  if (!existing) return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  if (existing.status !== "queued") {
    return NextResponse.json({ ok: false, message: "Order is not available for claiming.", order: existing }, { status: 409 });
  }

  const order = await updateOrderStatus(id, "printing", undefined, shop.slug);
  return NextResponse.json({ ok: true, order });
}
