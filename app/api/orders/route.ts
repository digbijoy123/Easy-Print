import { NextResponse } from "next/server";
import { listServices } from "@/lib/shopServices";
import { createOrder } from "@/lib/orders";

type Body = {
  shopSlug: string;
  files: Array<{ id: string; name: string; pathname: string; contentType?: string }>;
  serviceId: string;
  paper: "A4" | "A5" | "4x6";
  copies: number;
  payment: "upi" | "cash";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Body>;

    if (
      !body.shopSlug ||
      !Array.isArray(body.files) ||
      body.files.length === 0 ||
      !body.serviceId ||
      !body.paper ||
      !Number.isInteger(body.copies) ||
      body.copies < 1 ||
      body.copies > 99 ||
      !body.payment
    ) {
      return NextResponse.json({ ok: false, message: "Invalid order." }, { status: 400 });
    }

    const services = await listServices(body.shopSlug);
    const service = services.find((item) => item.id === body.serviceId && item.active);

    if (!service) {
      return NextResponse.json({ ok: false, message: "The selected service is no longer available." }, { status: 400 });
    }

    const copies = body.copies as number;
    const total = body.files.length * copies * service.price;
    const orderId = `EP-${Date.now().toString(36).toUpperCase()}`;

    const order = await createOrder({
      id: orderId,
      shopSlug: body.shopSlug,
      serviceId: service.id,
      serviceName: service.name,
      pricePerPage: service.price,
      paper: body.paper,
      copies,
      payment: body.payment,
      paymentStatus: "pending",
      status: "queued",
      total,
      files: body.files,
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
