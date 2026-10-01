"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  serviceName: string;
  paper: string;
  copies: number;
  total: number;
  files: Array<{ name: string }>;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export default function SandboxAgentPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("Ready.");
  const [running, setRunning] = useState(false);

  async function load() {
    const response = await fetch("/api/agent/orders?shop=demo", {
      headers: { Authorization: "Bearer epa_demo_sandbox" },
      cache: "no-store",
    });
    const data = await response.json();
    if (data.ok) setOrders(data.orders);
    else setMessage(data.message || "Agent queue unavailable.");
  }

  useEffect(() => { void load(); }, []);

  async function runCycle() {
    setRunning(true);
    setMessage("Virtual Print Agent is processing the next job...");
    try {
      const response = await fetch("/api/sandbox/agent/run", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message);
      setMessage(data.processed ? `Virtual printer completed ${data.order.id}.` : data.message);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Agent cycle failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", color: "#667085" }}>SHOP COMPUTER · SANDBOX</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Virtual Print Agent</h1>
          <p style={{ color: "#667085" }}>Demo Print Shop · simulated Windows agent and virtual printer</p>
        </div>
        <a href="/admin/demo">Shop settings →</a>
      </header>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <strong>Agent status</strong>
            <p style={{ margin: "6px 0 0", color: "#177245" }}>● Connected · Demo Agent</p>
          </div>
          <button onClick={runCycle} disabled={running} style={{ minHeight: 46, padding: "0 18px", border: 0, borderRadius: 10, background: "#111827", color: "#fff", fontWeight: 800 }}>
            {running ? "Processing…" : "Run print cycle"}
          </button>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 12, color: "#667085" }}>{message}</p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 20 }}>Queue</h2>
        {orders.length === 0 ? (
          <div style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", color: "#667085" }}>
            No active print jobs.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {orders.map((order) => (
              <div key={order.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff" }}>
                <div>
                  <strong>{order.id}</strong>
                  <div style={{ marginTop: 5, fontSize: 12, color: "#667085" }}>
                    {order.files.length} file{order.files.length !== 1 ? "s" : ""} · {order.serviceName} · {order.paper} · {order.copies} cop{order.copies !== 1 ? "ies" : "y"}
                  </div>
                </div>
                <strong>₹{order.total}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={{ marginTop: 24, fontSize: 11, color: "#667085" }}>
        Sandbox only. No real printer or payment is connected.
      </p>
    </main>
  );
}
