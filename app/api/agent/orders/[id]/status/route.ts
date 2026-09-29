import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders";

function authorized(request: Request) {
  const token = process.env.EASYPRINT_AGENT_TOKEN;
  return Boolean(token) && request.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "");

  if (status !== "printing" && status !== "printed" && status !== "failed") {
    return NextResponse.json({ ok: false, message: "Invalid status." }, { status: 400 });
  }

  const order = await updateOrderStatus(
    id,
    status as "printing" | "printed" | "failed"
  );

  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}
