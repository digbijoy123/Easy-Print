import { NextResponse } from "next/server";
import { listServices } from "@/lib/shopServices";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  const { shop } = await params;

  try {
    const services = await listServices(shop);
    return NextResponse.json({
      ok: true,
      services: services.filter((service) => service.active),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Services unavailable.";
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
