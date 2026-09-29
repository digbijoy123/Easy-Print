import crypto from "node:crypto";
import { deleteBlob, readJson, writeJson } from "@/lib/blobJson";

export type ShopService = {
  id: string;
  name: string;
  price: number;
  unit: string;
  active: boolean;
};

export type ShopRecord = {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  activationCode: string | null;
  agentToken: string;
  services: ShopService[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const shopPath = (slug: string) => `shops/${slug}.json`;
const activationIndexPath = (code: string) => `indexes/activation/${hashSecret(code)}.json`;
const agentIndexPath = (token: string) => `indexes/agent/${hashSecret(token)}.json`;

function hashSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeActivationCode(value: string) {
  return value.trim().toUpperCase();
}

async function ensureDemoShop() {
  const existing = await readJson<ShopRecord>(shopPath("demo"));
  if (existing) return existing;

  const now = new Date().toISOString();
  const shop: ShopRecord = {
    id: "sandbox-demo-shop",
    slug: "demo",
    name: "Demo Print Shop",
    ownerName: "Sandbox Owner",
    ownerPhone: "0000000000",
    activationCode: null,
    agentToken: "epa_demo_sandbox",
    services: [
      { id: "color-photo", name: "Colour Photo", price: 10, unit: "per page", active: true },
      { id: "bw-photo", name: "Black & White", price: 5, unit: "per page", active: true },
    ],
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  await writeJson(shopPath("demo"), shop);
  await writeJson(agentIndexPath(shop.agentToken), { slug: "demo" });
  return shop;
}

export async function createShop(input: {
  id?: string;
  slug?: string;
  name: string;
  ownerName?: string;
  ownerPhone?: string;
  activationCode?: string;
  agentToken?: string;
  services?: ShopService[];
}) {
  const now = new Date().toISOString();
  const id = input.id ?? crypto.randomUUID();
  const slug = input.slug ?? `ep-${crypto.randomBytes(5).toString("hex")}`;
  const activationCode = normalizeActivationCode(input.activationCode ?? `EP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`);
  const agentToken = (input.agentToken ?? `epa_${crypto.randomBytes(32).toString("hex")}`).trim();

  const shop: ShopRecord = {
    id,
    slug,
    name: input.name.trim(),
    ownerName: input.ownerName?.trim() ?? "",
    ownerPhone: input.ownerPhone?.trim() ?? "",
    activationCode,
    agentToken,
    services: input.services ?? [
      { id: "color-photo", name: "Colour Photo", price: 10, unit: "per page", active: true },
      { id: "bw-photo", name: "Black & White", price: 5, unit: "per page", active: true },
    ],
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  await writeJson(shopPath(slug), shop);
  await writeJson(activationIndexPath(activationCode), { slug });
  await writeJson(agentIndexPath(agentToken), { slug });
  return shop;
}

export async function updateShop(slug: string, patch: Partial<ShopRecord>) {
  const existing = await getShop(slug);
  if (!existing) throw new Error("Shop not found.");

  const next: ShopRecord = {
    ...existing,
    ...patch,
    slug: existing.slug,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await writeJson(shopPath(slug), next);
  return next;
}

export async function getShop(slug: string) {
  if (slug === "demo") return ensureDemoShop();
  if (!slug) return null;
  return readJson<ShopRecord>(shopPath(slug));
}

export async function activateShop(activationCode: string) {
  const normalized = normalizeActivationCode(activationCode);
  const index = await readJson<{ slug: string }>(activationIndexPath(normalized));
  if (!index) return null;

  const shop = await getShop(index.slug);
  if (!shop || !shop.active || shop.activationCode !== normalized) return null;

  await deleteBlob(activationIndexPath(normalized));
  return updateShop(shop.slug, { activationCode: null });
}

export async function getShopByAgentToken(token: string) {
  if (!token) return null;
  if (token === "epa_demo_sandbox") return ensureDemoShop();

  const index = await readJson<{ slug: string }>(agentIndexPath(token));
  if (!index) return null;

  const shop = await getShop(index.slug);
  return shop?.active && shop.agentToken === token ? shop : null;
}
