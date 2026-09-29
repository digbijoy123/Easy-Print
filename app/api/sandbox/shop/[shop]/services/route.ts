import { NextResponse } from "next/server";

export type PrintService = {
  id: string;
  name: string;
  price: number;
  unit: string;
  active: boolean;
};

const DEFAULT_SERVICES: PrintService[] = [
  { id: "color-photo", name: "Colour Photo", price: 10, unit: "per page", active: true },
  { id: "bw-photo", name: "Black & White", price: 5, unit: "per page", active: true },
];

type Store = Map<string, PrintService[]>;
const globalStore = globalThis as typeof globalThis & { __easyPrintServices?: Store };
const store: Store = globalStore.__easyPrintServices ?? new Map();
globalStore.__easyPrintServices = store;

function getServices(shop: string) {
  if (!store.has(shop)) store.set(shop, DEFAULT_SERVICES.map((item) => ({ ...item })));
  return store.get(shop)!;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  const { shop } = await params;
  return NextResponse.json({ ok: true, services: getServices(shop).filter((service) => service.active) });
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

  const services = body.services
    .filter((service: PrintService) => service && service.name && Number(service.price) >= 0)
    .map((service: PrintService) => ({
      id: String(service.id || crypto.randomUUID()),
      name: String(service.name).trim(),
      price: Number(service.price),
      unit: String(service.unit || "per page"),
      active: service.active !== false,
    }));

  store.set(shop, services);
  return NextResponse.json({ ok: true, services });
}
