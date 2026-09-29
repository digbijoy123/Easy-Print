import { neon } from "@neondatabase/serverless";

export type DbService = {
  id: string;
  shopSlug: string;
  name: string;
  price: number;
  unit: string;
  active: boolean;
};

export const DEFAULT_SERVICES: DbService[] = [
  { id: "color-photo", shopSlug: "demo", name: "Colour Photo", price: 10, unit: "per page", active: true },
  { id: "bw-photo", shopSlug: "demo", name: "Black & White", price: 5, unit: "per page", active: true },
];

const globalStore = globalThis as typeof globalThis & {
  __easyPrintMemory?: Map<string, DbService[]>;
};

const memoryStore = globalStore.__easyPrintMemory ?? new Map<string, DbService[]>();
globalStore.__easyPrintMemory = memoryStore;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

async function database() {
  if (!process.env.DATABASE_URL) return null;

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS print_services (
      id TEXT PRIMARY KEY,
      shop_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'per page',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS print_services_shop_slug_idx
    ON print_services (shop_slug)
  `;

  return sql;
}

export async function listServices(shopSlug: string) {
  const sql = await database();

  if (!sql) {
    if (!memoryStore.has(shopSlug)) {
      memoryStore.set(
        shopSlug,
        DEFAULT_SERVICES.map((service) => ({ ...service, shopSlug }))
      );
    }

    return memoryStore.get(shopSlug) ?? [];
  }

  const rows = await sql`
    SELECT
      id,
      shop_slug AS "shopSlug",
      name,
      price::float AS price,
      unit,
      active
    FROM print_services
    WHERE shop_slug = ${shopSlug}
    ORDER BY updated_at ASC, name ASC
  `;

  if (!rows.length) {
    for (const service of DEFAULT_SERVICES) {
      await sql`
        INSERT INTO print_services (id, shop_slug, name, price, unit, active)
        VALUES (
          ${service.id},
          ${shopSlug},
          ${service.name},
          ${service.price},
          ${service.unit},
          ${service.active}
        )
        ON CONFLICT (id) DO UPDATE SET
          shop_slug = EXCLUDED.shop_slug,
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          unit = EXCLUDED.unit,
          active = EXCLUDED.active
      `;
    }

    return DEFAULT_SERVICES.map((service) => ({ ...service, shopSlug }));
  }

  return rows as DbService[];
}

export async function replaceServices(shopSlug: string, services: DbService[]) {
  const sql = await database();

  if (!sql) {
    memoryStore.set(
      shopSlug,
      services.map((service) => ({ ...service, shopSlug }))
    );
    return memoryStore.get(shopSlug) ?? [];
  }

  const existing = await sql`
    SELECT id
    FROM print_services
    WHERE shop_slug = ${shopSlug}
  `;

  const ids = new Set(services.map((service) => service.id));

  for (const row of existing) {
    if (!ids.has(String(row.id))) {
      await sql`DELETE FROM print_services WHERE id = ${String(row.id)}`;
    }
  }

  for (const service of services) {
    await sql`
      INSERT INTO print_services (id, shop_slug, name, price, unit, active)
      VALUES (
        ${service.id},
        ${shopSlug},
        ${service.name},
        ${service.price},
        ${service.unit},
        ${service.active}
      )
      ON CONFLICT (id) DO UPDATE SET
        shop_slug = EXCLUDED.shop_slug,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        unit = EXCLUDED.unit,
        active = EXCLUDED.active,
        updated_at = NOW()
    `;
  }

  return listServices(shopSlug);
}
