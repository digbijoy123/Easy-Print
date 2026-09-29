import { NextResponse } from "next/server";

type OrderPayload = {
  shopSlug: string;
  files: Array<{ name: string }>;
  service?: string;
  serviceId?: string;
  pricePerPage?: number;
  color?: "color" | "bw";
  paper: "A4" | "A5" | "4x6";
  copies: number;
  payment: "upi" | "cash";
  total: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<OrderPayload>;

  const hasService = Boolean(body.service || body.serviceId || body.color);

  if (
    !body.shopSlug ||
    !Array.isArray(body.files) ||
    body.files.length === 0 ||
    !hasService ||
    !body.paper ||
    typeof body.copies !== "number" ||
    body.copies < 1 ||
    !body.payment ||
    typeof body.total !== "number" ||
    body.total < 0
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
      service: body.service ?? body.color,
      serviceId: body.serviceId,
      pricePerPage: body.pricePerPage,
      paper: body.paper,
      copies: body.copies,
      payment: body.payment,
      status: "queued",
      paymentStatus: body.payment === "cash" ? "cash_due" : "mock_paid",
      printAgentStatus: "virtual_queue",
      printStatus: "waiting",
      createdAt: new Date().toISOString(),
      total: body.total,
    },
  });
}
