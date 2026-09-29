import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function startAgent(config, onEvent = () => {}) {
  const { server, token, shop, output, autoConfirmCash = false } = config;

  if (!server || !token || !shop) {
    throw new Error("Easy Print agent requires server, token and shop.");
  }

  const headers = { Authorization: `Bearer ${token}` };
  const printedJobs = new Map();

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  }

  async function confirmCash(orderId) {
    const jobDir = printedJobs.get(orderId);
    await api(`${server}/api/agent/orders/${orderId}/payment`, { method: "POST" });
    await api(`${server}/api/agent/orders/${orderId}/complete`, { method: "POST" });

    if (jobDir) {
      await fs.rm(jobDir, { recursive: true, force: true });
      printedJobs.delete(orderId);
    }

    onEvent({ type: "completed", orderId });
  }

  async function processOrder(order) {
    onEvent({ type: "processing", order });
    await api(`${server}/api/agent/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "printing" }),
    });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "easyprint-"));
    let jobDir = null;

    try {
      const localFiles = [];

      for (const file of order.files) {
        const response = await fetch(
          `${server}/api/agent/orders/${order.id}/files/${file.id}`,
          { headers }
        );
        if (!response.ok) throw new Error(`Could not download ${file.name}`);

        const destination = path.join(
          tempDir,
          file.name.replace(/[<>:"/\\|?*]/g, "_")
        );
        await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
        localFiles.push(destination);
      }

      await fs.mkdir(output, { recursive: true });
      jobDir = path.join(output, order.id);
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

      // The virtual-printer folder represents the printer's output for now.
      // Once the physical printer integration is added, this step will call it.
      await api(`${server}/api/agent/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "printed" }),
      });

      printedJobs.set(order.id, jobDir);

      if (order.payment === "cash" && autoConfirmCash) {
        await confirmCash(order.id);
      }

      onEvent({ type: "printed", order, jobDir });
    } catch (error) {
      if (jobDir) await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
      await api(`${server}/api/agent/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed" }),
      }).catch(() => {});
      onEvent({ type: "failed", order, error });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async function poll() {
    try {
      const data = await api(
        `${server}/api/agent/orders?shop=${encodeURIComponent(shop)}`
      );
      onEvent({ type: "connected", shop, orders: data.orders || [] });
      for (const order of data.orders || []) {
        if (order.status === "queued") await processOrder(order);
      }
    } catch (error) {
      onEvent({ type: "offline", error });
    }
  }

  const timer = setInterval(poll, 5000);
  poll();

  const stop = () => clearInterval(timer);
  stop.confirmCash = confirmCash;
  return stop;
}
