import { neon } from "@neondatabase/serverless";

export type ShopRecord = {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  activationCode: string | null;
  agentToken: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL DEFAULT '',
      owner_phone TEXT NOT NULL DEFAULT '',
      activation_code TEXT UNIQUE,
      agent_token TEXT UNIQUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  return sql;
}

function mapRow(row: Record<string, unknown>): ShopRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    ownerName: String(row.owner_name ?? ""),
    ownerPhone: String(row.owner_phone ?? ""),
    activationCode: row.activation_code ? String(row.activation_code) : null,
    agentToken: row.agent_token ? String(row.agent_token) : null,
    active: Boolean(row.active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function createShop(input: {
  id: string;
  slug: string;
  name: string;
  ownerName?: string;
  ownerPhone?: string;
  activationCode: string;
  agentToken: string;
}) {
  const sql = await db();
  const rows = await sql`
    INSERT INTO shops (id, slug, name, owner_name, owner_phone, activation_code, agent_token)
    VALUES (
      ${input.id}, ${input.slug}, ${input.name},
      ${input.ownerName ?? ""}, ${input.ownerPhone ?? ""},
      ${input.activationCode}, ${input.agentToken}
    )
    RETURNING *
  `;
  return mapRow(rows[0]);
}

export async function getShop(slug: string) {
  const sql = await db();
  const rows = await sql`SELECT * FROM shops WHERE slug = ${slug} LIMIT 1`;
  return rows.length ? mapRow(rows[0]) : null;
}

export async function activateShop(activationCode: string) {
  const sql = await db();
  const rows = await sql`
    UPDATE shops
    SET activation_code = NULL, updated_at = NOW()
    WHERE activation_code = ${activationCode} AND active = TRUE
    RETURNING *
  `;
  return rows.length ? mapRow(rows[0]) : null;
}
