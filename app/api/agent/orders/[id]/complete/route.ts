import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/orders";

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
  const order = await getOrder(id);

  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  if (order.paymentStatus !== "confirmed") {
    return NextResponse.json(
      { ok: false, message: "Payment must be confirmed before files are deleted." },
      { status: 409 }
    );
  }

  if (order.status !== "printed") {
    return NextResponse.json(
      { ok: false, message: "Order must be printed before files are deleted." },
      { status: 409 }
    );
  }

  try {
    for (const file of order.files) {
      await del(file.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }

    const completed = await updateOrderStatus(id, "completed");
    return NextResponse.json({
      ok: true,
      order: completed,
      filesDeleted: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete order files.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
