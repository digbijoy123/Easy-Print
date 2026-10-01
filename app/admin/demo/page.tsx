"use client";

import { useEffect, useState } from "react";

type Service = { id: string; name: string; price: number; unit: string; active: boolean };

export default function ShopSettingsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("10");
  const [unit, setUnit] = useState("per page");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/sandbox/shop/demo/services", { cache: "no-store" });
    const data = await response.json();
    if (data.ok) setServices(data.services);
  }

  useEffect(() => { void load(); }, []);

  async function save(next: Service[]) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/sandbox/shop/demo/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: next }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message);
      setServices(data.services);
      setMessage("Sandbox shop settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  function addService() {
    const value = Number(price);
    if (!name.trim() || !Number.isFinite(value) || value < 0) return;
    const next = [...services, { id: crypto.randomUUID(), name: name.trim(), price: value, unit: unit.trim() || "per page", active: true }];
    setName(""); setPrice("10"); setUnit("per page"); void save(next);
  }

  function updateLocal(id: string, patch: Partial<Service>) {
    setServices((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  return (
    <main className="order-shell settings-page">
      <header className="shop-header">
        <div className="brand-mark small">EP</div>
        <div><strong>Demo Print Shop</strong><span>Shop owner settings · Sandbox</span></div>
        <a className="admin-link" href="/s/demo">Customer view →</a>
      </header>
      <section className="admin-hero">
        <p className="eyebrow">SHOP SETTINGS</p>
        <h1>Set your printing prices.</h1>
        <p>Add or change services anytime. The customer QR page uses the active service list.</p>
      </section>
      <section className="admin-card">
        <div className="admin-card-title">
          <div><p className="eyebrow">PRINTING SERVICES</p><h2>Services shown to customers</h2></div>
          <span className="sandbox-badge">SANDBOX</span>
        </div>
        <div className="service-list">
          {services.map((service) => (
            <div className={service.active ? "service-row" : "service-row disabled"} key={service.id}>
              <div className="service-main">
                <input className="service-name" value={service.name} onChange={(e) => updateLocal(service.id, { name: e.target.value })} onBlur={() => void save(services)} />
                <span>{service.unit}</span>
              </div>
              <label className="price-field">₹<input type="number" min="0" step="0.5" value={service.price} onChange={(e) => updateLocal(service.id, { price: Number(e.target.value) })} onBlur={() => void save(services)} /></label>
              <button className={service.active ? "toggle active" : "toggle"} onClick={() => { const next = services.map((item) => item.id === service.id ? { ...item, active: !item.active } : item); void save(next); }}>{service.active ? "Active" : "Hidden"}</button>
              <button className="delete-service" onClick={() => void save(services.filter((item) => item.id !== service.id))}>×</button>
            </div>
          ))}
        </div>
        <div className="add-service">
          <input placeholder="New service name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Price" type="number" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} />
          <input placeholder="Unit, e.g. per page" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <button className="primary-button add-service-button" onClick={addService} disabled={saving}>+ Add service</button>
        </div>
        {message && <p className="admin-message">{message}</p>}
      </section>
      <p className="admin-note">Sandbox mode: services and orders use the Easy Print test storage layer. No real payment or printing occurs.</p>
    </main>
  );
}
