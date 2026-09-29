import { NextResponse } from "next/server";
import { listQueuedOrders } from "@/lib/orders";

function authorized(request: Request) {
  const token = process.env.EASYPRINT_AGENT_TOKEN;
  return Boolean(token) && request.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const orders = await listQueuedOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent queue unavailable.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
