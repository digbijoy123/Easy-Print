import { neon } from "@neondatabase/serverless";

export type OrderFile = {
  id: string;
  name: string;
  pathname: string;
  contentType?: string;
};

export type OrderRecord = {
  id: string;
  shopSlug: string;
  serviceId: string;
  serviceName: string;
  pricePerPage: number;
  paper: "A4" | "A5" | "4x6";
  copies: number;
  payment: "upi" | "cash";
  paymentStatus: "pending" | "confirmed";
  status: "queued" | "printing" | "printed" | "completed" | "failed";
  total: number;
  files: OrderFile[];
  createdAt: string;
  updatedAt: string;
};

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS print_orders (
      id TEXT PRIMARY KEY,
      shop_slug TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      price_per_page NUMERIC(10,2) NOT NULL,
      paper TEXT NOT NULL,
      copies INTEGER NOT NULL,
      payment TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'queued',
      total NUMERIC(10,2) NOT NULL,
      files JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  return sql;
}

export async function createOrder(input: Omit<OrderRecord, "createdAt" | "updatedAt">) {
  const sql = await db();
  const rows = await sql`
    INSERT INTO print_orders (
      id, shop_slug, service_id, service_name, price_per_page,
      paper, copies, payment, payment_status, status, total, files
    )
    VALUES (
      ${input.id}, ${input.shopSlug}, ${input.serviceId}, ${input.serviceName},
      ${input.pricePerPage}, ${input.paper}, ${input.copies}, ${input.payment},
      ${input.paymentStatus}, ${input.status}, ${input.total}, ${JSON.stringify(input.files)}::jsonb
    )
    RETURNING *
  `;

  return mapRow(rows[0]);
}

export async function listQueuedOrders(shopSlug?: string) {
  const sql = await db();
  const rows = shopSlug
    ? await sql`
        SELECT * FROM print_orders
        WHERE shop_slug = ${shopSlug} AND status IN ('queued', 'printing', 'printed')
        ORDER BY created_at ASC
      `
    : await sql`
        SELECT * FROM print_orders
        WHERE status IN ('queued', 'printing', 'printed')
        ORDER BY created_at ASC
      `;

  return rows.map(mapRow);
}

export async function getOrder(id: string) {
  const sql = await db();
  const rows = await sql`SELECT * FROM print_orders WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapRow(rows[0]) : null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderRecord["status"],
  paymentStatus?: OrderRecord["paymentStatus"]
) {
  const sql = await db();
  const rows = paymentStatus
    ? await sql`
        UPDATE print_orders
        SET status = ${status}, payment_status = ${paymentStatus}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    : await sql`
        UPDATE print_orders
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

  return rows.length ? mapRow(rows[0]) : null;
}

function mapRow(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    shopSlug: String(row.shop_slug),
    serviceId: String(row.service_id),
    serviceName: String(row.service_name),
    pricePerPage: Number(row.price_per_page),
    paper: row.paper as OrderRecord["paper"],
    copies: Number(row.copies),
    payment: row.payment as OrderRecord["payment"],
    paymentStatus: row.payment_status as OrderRecord["paymentStatus"],
    status: row.status as OrderRecord["status"],
    total: Number(row.total),
    files: (row.files ?? []) as OrderFile[],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}
