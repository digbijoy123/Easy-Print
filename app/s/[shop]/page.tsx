import { notFound } from "next/navigation";
import PrintOrder from "./PrintOrder";
import { getShop } from "@/lib/shops";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const record = await getShop(shop);

  if (!record || !record.active) {
    notFound();
  }

  return <PrintOrder shopSlug={record.slug} />;
}
