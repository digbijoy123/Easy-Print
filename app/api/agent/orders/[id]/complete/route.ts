import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agentAuth";
import { deleteOrder, getOrder } from "@/lib/orders";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const shop = await authenticateAgent(request);
  if (!shop) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const order = await getOrder(id, shop.slug);

  if (!order) return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  if (order.paymentStatus !== "confirmed") {
    return NextResponse.json({ ok: false, message: "Payment must be confirmed before files are deleted." }, { status: 409 });
  }
  if (order.status !== "printed") {
    return NextResponse.json({ ok: false, message: "Order must be printed before files are deleted." }, { status: 409 });
  }

  try {
    await Promise.all(order.files.map((file) => del(file.pathname)));
    await deleteOrder(order.id, order.shopSlug);
    return NextResponse.json({ ok: true, filesDeleted: true, orderDeleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete order files.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
