import "dotenv/config";
import path from "node:path";
import { startAgent } from "./service.js";

const stop = startAgent(
  {
    server: process.env.EASYPRINT_SERVER_URL,
    token: process.env.EASYPRINT_AGENT_TOKEN,
    shop: process.env.EASYPRINT_SHOP_SLUG,
    output: path.resolve(process.env.EASYPRINT_OUTPUT_DIR || "./virtual-printer-output"),
    autoConfirmCash: process.env.EASYPRINT_AUTO_CONFIRM_CASH === "true",
  },
  (event) => {
    if (event.type === "offline") console.error("[Easy Print] Offline:", event.error?.message || event.error);
    if (event.type === "printed") console.log("[Easy Print] Printed:", event.order.id);
    if (event.type === "failed") console.error("[Easy Print] Failed:", event.order.id);
    if (event.type === "connected") console.log("[Easy Print] Connected for shop:", event.shop);
  }
);

process.on("SIGINT", () => { stop(); process.exit(0); });
