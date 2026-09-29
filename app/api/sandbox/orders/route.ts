import { NextResponse } from "next/server";

type OrderPayload = {
  shopSlug: string;
  files: Array<{ name: string }>;
  color: "color" | "bw";
  paper: "A4" | "A5" | "4x6";
  copies: number;
  payment: "upi" | "cash";
  total: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<OrderPayload>;

  if (
    !body.shopSlug ||
    !Array.isArray(body.files) ||
    body.files.length === 0 ||
    !body.color ||
    !body.paper ||
    !body.copies ||
    !body.payment ||
    typeof body.total !== "number"
  ) {
    return NextResponse.json(
      { ok: false, message: "Invalid sandbox order." },
      { status: 400 }
    );
  }

  const orderId = `EP-SANDBOX-${Date.now().toString(36).toUpperCase()}`;

  return NextResponse.json({
    ok: true,
    sandbox: true,
    order: {
      id: orderId,
      shopSlug: body.shopSlug,
      status: "queued",
      paymentStatus: body.payment === "cash" ? "cash_due" : "mock_paid",
      printAgentStatus: "virtual_queue",
      printStatus: "waiting",
      createdAt: new Date().toISOString(),
      total: body.total,
    },
  });
}
