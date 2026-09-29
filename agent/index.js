import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const SERVER = process.env.EASYPRINT_SERVER_URL;
const TOKEN = process.env.EASYPRINT_AGENT_TOKEN;
const SHOP = process.env.EASYPRINT_SHOP_SLUG || "demo";
const OUTPUT = path.resolve(process.env.EASYPRINT_OUTPUT_DIR || "./virtual-printer-output");
const AUTO_CONFIRM_CASH = process.env.EASYPRINT_AUTO_CONFIRM_CASH === "true";

if (!SERVER || !TOKEN) {
  throw new Error("Set EASYPRINT_SERVER_URL and EASYPRINT_AGENT_TOKEN before starting the agent.");
}

const headers = { Authorization: `Bearer ${TOKEN}` };

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

async function processOrder(order) {
  console.log(`[Easy Print] Processing ${order.id}`);

  await api(`${SERVER}/api/agent/orders/${order.id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "printing" }),
  });

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "easyprint-"));

  try {
    const localFiles = [];

    for (const file of order.files) {
      const response = await fetch(
        `${SERVER}/api/agent/orders/${order.id}/files/${file.id}`,
        { headers }
      );

      if (!response.ok) throw new Error(`Could not download ${file.name}`);

      const destination = path.join(tempDir, file.name.replace(/[<>:"/\\|?*]/g, "_"));
      await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
      localFiles.push(destination);
    }

    await fs.mkdir(OUTPUT, { recursive: true });

    const jobDir = path.join(OUTPUT, order.id);
    await fs.mkdir(jobDir, { recursive: true });

    for (const file of localFiles) {
      await fs.copyFile(file, path.join(jobDir, path.basename(file)));
    }

    await fs.writeFile(
      path.join(jobDir, "print-job.json"),
      JSON.stringify(
        {
          orderId: order.id,
          service: order.serviceName,
          paper: order.paper,
          copies: order.copies,
          total: order.total,
          createdAt: order.createdAt,
          printer: "Virtual Printer",
        },
        null,
        2
      )
    );

    console.log(`[Easy Print] Virtual print completed: ${jobDir}`);

    await api(`${SERVER}/api/agent/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "printed" }),
    });

    if (order.payment === "cash" && AUTO_CONFIRM_CASH) {
      await api(`${SERVER}/api/agent/orders/${order.id}/payment`, {
        method: "POST",
      });

      await api(`${SERVER}/api/agent/orders/${order.id}/complete`, {
        method: "POST",
      });

      console.log(`[Easy Print] Payment confirmed; customer files deleted for ${order.id}`);
    } else {
      console.log(`[Easy Print] Waiting for payment confirmation before remote file deletion: ${order.id}`);
    }
  } catch (error) {
    await api(`${SERVER}/api/agent/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "failed" }),
    }).catch(() => {});

    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function poll() {
  try {
    const data = await api(`${SERVER}/api/agent/orders?shop=${encodeURIComponent(SHOP)}`);
    for (const order of data.orders || []) {
      if (order.status !== "queued") continue;
      try {
        await processOrder(order);
      } catch (error) {
        console.error(`[Easy Print] ${order.id} failed:`, error);
      }
    }
  } catch (error) {
    console.error("[Easy Print] Queue check failed:", error.message);
  }
}

console.log(`[Easy Print] Agent connected for shop: ${SHOP}`);
console.log(`[Easy Print] Virtual printer output: ${OUTPUT}`);
setInterval(poll, 5000);
await poll();
