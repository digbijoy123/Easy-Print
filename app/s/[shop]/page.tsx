import PrintOrder from "./PrintOrder";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;

  return <PrintOrder shopSlug={shop} />;
}
