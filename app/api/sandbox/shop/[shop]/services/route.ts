import { NextResponse } from "next/server";
import { listServices, replaceServices, type DbService } from "../../../../../lib/shopServices";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  const { shop } = await params;
  const services = await listServices(shop);
  return NextResponse.json({
    ok: true,
    persistent: Boolean(process.env.DATABASE_URL),
    services: services.filter((service) => service.active),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  const { shop } = await params;
  const body = await request.json();

  if (!Array.isArray(body.services)) {
    return NextResponse.json({ ok: false, message: "services must be an array" }, { status: 400 });
  }

  const services: DbService[] = body.services
    .filter((service: DbService) => service && service.name && Number(service.price) >= 0)
    .map((service: DbService) => ({
      id: String(service.id || crypto.randomUUID()),
      shopSlug: shop,
      name: String(service.name).trim(),
      price: Number(service.price),
      unit: String(service.unit || "per page"),
      active: service.active !== false,
    }));

  const saved = await replaceServices(shop, services);

  return NextResponse.json({
    ok: true,
    persistent: Boolean(process.env.DATABASE_URL),
    services: saved,
  });
}
