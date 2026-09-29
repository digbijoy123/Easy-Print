import { getShopByAgentToken, type ShopRecord } from "@/lib/shops";

export async function authenticateAgent(request: Request): Promise<ShopRecord | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  return getShopByAgentToken(header.slice(7).trim());
}
