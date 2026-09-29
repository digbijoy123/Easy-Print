import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agentAuth";
import { getOrder, updateOrderStatus } from "@/lib/orders";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const shop = await authenticateAgent(request);
  if (!shop) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "");

  if (status !== "printing" && status !== "printed" && status !== "failed") {
    return NextResponse.json({ ok: false, message: "Invalid status." }, { status: 400 });
  }

  const existing = await getOrder(id, shop.slug);
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  const order = await updateOrderStatus(id, status as "printing" | "printed" | "failed", undefined, shop.slug);
  return NextResponse.json({ ok: true, order });
}
