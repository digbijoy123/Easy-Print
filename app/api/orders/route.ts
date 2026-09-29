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
    const shopSlug = typeof body.shopSlug === "string" ? body.shopSlug : "";
    const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";
    const paper = body.paper;
    const payment = body.payment;
    const copies = Number(body.copies);
    const files = Array.isArray(body.files) ? body.files : [];

    uploadedFiles = files;

    if (
      !shopSlug ||
      files.length === 0 ||
      !serviceId ||
      (paper !== "A4" && paper !== "A5" && paper !== "4x6") ||
      !Number.isInteger(copies) ||
      copies < 1 ||
      copies > 99 ||
      (payment !== "cash" && payment !== "upi")
    ) {
      return NextResponse.json({ ok: false, message: "Invalid order." }, { status: 400 });
    }

    const shop = await getShop(shopSlug);
    if (!shop || !shop.active) {
      return NextResponse.json({ ok: false, message: "Shop not found." }, { status: 404 });
    }

    const expectedPrefix = `incoming/${shopSlug}/`;
    if (files.some((file) => !file.pathname.startsWith(expectedPrefix))) {
      return NextResponse.json({ ok: false, message: "Invalid uploaded file." }, { status: 400 });
    }

    const services = await listServices(shopSlug);
    const service = services.find((item) => item.id === serviceId && item.active);

    if (!service) {
      return NextResponse.json(
        { ok: false, message: "The selected service is no longer available." },
        { status: 400 }
      );
    }

    const total = files.length * copies * service.price;
    const orderId = `EP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const order = await createOrder({
      id: orderId,
      shopSlug,
      serviceId: service.id,
      serviceName: service.name,
      pricePerPage: service.price,
      paper,
      copies,
      payment: payment === "upi" ? "upi" : "cash",
      paymentStatus: "pending",
      status: "queued",
      total,
      files,
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => del(file.pathname).catch(() => {})));
    const message = error instanceof Error ? error.message : "Could not create order.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
