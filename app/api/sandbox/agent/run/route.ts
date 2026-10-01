import { NextResponse } from "next/server";
import { getShop } from "@/lib/shops";
import { listQueuedOrders, updateOrderStatus } from "@/lib/orders";

export async function POST() {
  try {
    const shop = await getShop("demo");
    if (!shop) return NextResponse.json({ ok: false, message: "Demo shop unavailable." }, { status: 503 });

    const orders = await listQueuedOrders(shop.slug);
    const order = orders.find((item) => item.status === "queued");
    if (!order) return NextResponse.json({ ok: true, processed: false, message: "No queued sandbox order." });

    const printing = await updateOrderStatus(order.id, "printing", undefined, shop.slug);
    await updateOrderStatus(order.id, "printed", "confirmed", shop.slug);
    const completed = await updateOrderStatus(order.id, "completed", "confirmed", shop.slug);

    return NextResponse.json({
      ok: true,
      processed: true,
      order: completed ?? printing,
      virtualPrinter: { status: "printed", copies: order.copies, files: order.files.length },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Virtual agent failed." }, { status: 503 });
  }
}
