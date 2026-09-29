import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { listServices } from "@/lib/shopServices";
import { createOrder } from "@/lib/orders";
import { getShop } from "@/lib/shops";

type Body = {
  shopSlug: string;
  files: Array<{ id: string; name: string; pathname: string; contentType?: string }>;
  serviceId: string;
  paper: "A4" | "A5" | "4x6";
  copies: number;
  payment: "upi" | "cash";
};

export async function POST(request: Request) {
  let uploadedFiles: Body["files"] = [];

  try {
    const body = (await request.json()) as Partial<Body>;
    uploadedFiles = Array.isArray(body.files) ? body.files : [];
    const copies = Number(body.copies);

    if (
      !body.shopSlug ||
      !Array.isArray(body.files) ||
      body.files.length === 0 ||
      !body.serviceId ||
      !body.paper ||
      !Number.isInteger(copies) ||
      copies < 1 ||
      copies > 99 ||
      body.payment !== "cash"
    ) {
      return NextResponse.json({ ok: false, message: "Invalid order." }, { status: 400 });
    }

    const shop = await getShop(body.shopSlug);
    if (!shop || !shop.active) {
      return NextResponse.json({ ok: false, message: "Shop not found." }, { status: 404 });
    }

    const expectedPrefix = `incoming/${body.shopSlug}/`;
    if (body.files.some((file) => !file.pathname.startsWith(expectedPrefix))) {
      return NextResponse.json({ ok: false, message: "Invalid uploaded file." }, { status: 400 });
    }

    const services = await listServices(body.shopSlug);
    const service = services.find((item) => item.id === body.serviceId && item.active);

    if (!service) {
      return NextResponse.json({ ok: false, message: "The selected service is no longer available." }, { status: 400 });
    }

    const total = body.files.length * copies * service.price;
    const orderId = `EP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const order = await createOrder({
      id: orderId,
      shopSlug: body.shopSlug,
      serviceId: service.id,
      serviceName: service.name,
      pricePerPage: service.price,
      paper: body.paper,
      copies,
      payment: "cash",
      paymentStatus: "pending",
      status: "queued",
      total,
      files: body.files,
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => del(file.pathname).catch(() => {})));
    const message = error instanceof Error ? error.message : "Could not create order.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
