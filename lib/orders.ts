import { del, get, list, put } from "@vercel/blob";

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

function orderPath(shopSlug: string, id: string) {
  return `orders/${shopSlug}/${id}.json`;
}

async function readOrder(pathname: string) {
  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await new Response(result.stream).text()) as OrderRecord;
  } catch {
    return null;
  }
}

async function writeOrder(order: OrderRecord) {
  await put(orderPath(order.shopSlug, order.id), JSON.stringify(order), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  return order;
}

export async function createOrder(input: Omit<OrderRecord, "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  return writeOrder({ ...input, createdAt: now, updatedAt: now });
}

export async function listQueuedOrders(shopSlug: string) {
  const result = await list({ prefix: `orders/${shopSlug}/`, limit: 1000 });
  const orders = await Promise.all(
    result.blobs
      .filter((blob) => blob.pathname.endsWith(".json"))
      .map((blob) => readOrder(blob.pathname))
  );

  return orders
    .filter((order): order is OrderRecord =>
      order !== null && ["queued", "printing", "printed"].includes(order.status)
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getOrder(id: string, shopSlug?: string) {
  if (shopSlug) return readOrder(orderPath(shopSlug, id));

  const result = await list({ prefix: "orders/", limit: 1000 });
  const match = result.blobs.find((blob) => blob.pathname.endsWith(`/${id}.json`));
  return match ? readOrder(match.pathname) : null;
}

export async function updateOrderStatus(
  id: string,
  status?: OrderRecord["status"],
  paymentStatus?: OrderRecord["paymentStatus"],
  shopSlug?: string
) {
  const order = await getOrder(id, shopSlug);
  if (!order) return null;

  return writeOrder({
    ...order,
    status: status ?? order.status,
    paymentStatus: paymentStatus ?? order.paymentStatus,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteOrder(id: string, shopSlug: string) {
  await del(orderPath(shopSlug, id));
}
