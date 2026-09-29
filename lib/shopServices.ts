import { getShop, updateShop, type ShopService } from "@/lib/shops";

export type DbService = ShopService & { shopSlug: string };

export const DEFAULT_SERVICES: ShopService[] = [
  { id: "color-photo", name: "Colour Photo", price: 10, unit: "per page", active: true },
  { id: "bw-photo", name: "Black & White", price: 5, unit: "per page", active: true },
];

export async function listServices(shopSlug: string): Promise<DbService[]> {
  const shop = await getShop(shopSlug);
  if (!shop) return [];
  return shop.services.map((service) => ({ ...service, shopSlug }));
}

export async function replaceServices(shopSlug: string, services: DbService[]) {
  const shop = await getShop(shopSlug);
  if (!shop) throw new Error("Shop not found.");

  const clean = services.map(({ id, name, price, unit, active }) => ({
    id: String(id),
    name: String(name).trim(),
    price: Number(price),
    unit: String(unit || "per page").trim(),
    active: Boolean(active),
  }));

  const updated = await updateShop(shopSlug, { services: clean });
  return updated.services.map((service) => ({ ...service, shopSlug }));
}

export function hasDatabase() {
  return false;
}
