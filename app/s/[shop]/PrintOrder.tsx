"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import PhotoEditor from "./PhotoEditor";

type PaperSize = "A4" | "A5" | "4x6";
type Payment = "upi" | "cash";

type PrintFile = {
  id: string;
  name: string;
  url: string;
};

type PrintService = {
  id: string;
  name: string;
  price: number;
  unit: string;
  active: boolean;
};

const PAPER_LABELS: Record<PaperSize, string> = {
  A4: "A4",
  A5: "A5",
  "4x6": '4 × 6"',
};

const FALLBACK_SERVICES: PrintService[] = [
  { id: "color-photo", name: "Colour Photo", price: 10, unit: "per page", active: true },
  { id: "bw-photo", name: "Black & White", price: 5, unit: "per page", active: true },
];

export default function PrintOrder({ shopSlug }: { shopSlug: string }) {
  const [files, setFiles] = useState<PrintFile[]>([]);
  const [services, setServices] = useState<PrintService[]>(FALLBACK_SERVICES);
  const [selectedService, setSelectedService] = useState("color-photo");
  const [paper, setPaper] = useState<PaperSize>("A4");
  const [copies, setCopies] = useState(1);
  const [payment, setPayment] = useState<Payment>("upi");
  const [editingFile, setEditingFile] = useState<PrintFile | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/sandbox/shop/${shopSlug}/services`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.services) && data.services.length) {
          setServices(data.services);
          setSelectedService(data.services[0].id);
        }
      })
      .catch(() => {});
  }, [shopSlug]);

  const service = services.find((item) => item.id === selectedService) ?? services[0];
  const pricePerPage = service?.price ?? 0;
  const total = useMemo(
    () => files.length * copies * pricePerPage,
    [files.length, copies, pricePerPage]
  );

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const next = selected
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
      }));

    setFiles((current) => [...current, ...next]);
    event.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function saveEditedPhoto(url: string) {
    if (!editingFile) return;
    setFiles((current) =>
      current.map((file) => (file.id === editingFile.id ? { ...file, url } : file))
    );
  }

  function changeCopies(delta: number) {
    setCopies((value) => Math.min(99, Math.max(1, value + delta)));
  }

  async function submitOrder() {
    if (!files.length || sending) return;
    setSending(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/sandbox/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          files: files.map((file) => ({ name: file.name })),
          service: service?.name,
          serviceId: service?.id,
          pricePerPage,
          paper,
          copies,
          payment,
          total,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Order failed");

      setOrderId(data.order.id);
      setSubmitted(true);
    } catch {
      setSubmitError("The sandbox could not create the order. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <main className="order-shell">
        <section className="success-card">
          <div className="success-icon">✓</div>
          <p className="eyebrow">SANDBOX ORDER</p>
          <h1>Your virtual order is queued.</h1>
          <p>This is a virtual test environment. No real payment is made and no physical printer is contacted.</p>
          <div className="order-ticket">
            <div><span>Order ID</span><strong>{orderId}</strong></div>
            <div><span>Shop</span><strong>Demo Print Shop</strong></div>
            <div><span>Service</span><strong>{service?.name}</strong></div>
            <div><span>Files</span><strong>{files.length} photo{files.length !== 1 ? "s" : ""}</strong></div>
            <div><span>Print</span><strong>{copies} copy{copies !== 1 ? "ies" : "y"} · {PAPER_LABELS[paper]}</strong></div>
            <div><span>Total</span><strong>₹{total}</strong></div>
          </div>
          <div className="sandbox-status">● Virtual Print Agent · Job queued for simulation</div>
          <button className="secondary-button" onClick={() => setSubmitted(false)}>Back to order</button>
        </section>
      </main>
    );
  }

  return (
    <main className="order-shell">
      <header className="shop-header">
        <div className="brand-mark small">EP</div>
        <div>
          <strong>Demo Print Shop</strong>
          <span>Easy Print Demo</span>
        </div>
        <div className="secure-pill">● Ready</div>
      </header>

      <div className="order-layout">
        <section className="order-main">
          <div className="section-intro">
            <p className="eyebrow">PRINT ORDER</p>
            <h1>What would you like to print?</h1>
            <p>Select photos from your phone. You can add multiple files.</p>
          </div>

          <label className="upload-zone">
            <input type="file" accept="image/*" multiple onChange={handleFiles} />
            <span className="upload-icon">↑</span>
            <strong>Add photos</strong>
            <span>JPG, PNG or HEIC · Select one or more</span>
          </label>

          {files.length > 0 && (
            <div className="file-section">
              <div className="section-heading">
                <div>
                  <strong>{files.length} photo{files.length !== 1 ? "s" : ""} selected</strong>
                  <span>Use Edit to adjust each photo before printing.</span>
                </div>
                <label className="add-more">
                  + Add more
                  <input type="file" accept="image/*" multiple onChange={handleFiles} />
                </label>
              </div>

              <div className="preview-grid">
                {files.map((file) => (
                  <div className="photo-card" key={file.id}>
                    <img src={file.url} alt={file.name} />
                    <div className="photo-card-actions">
                      <button className="photo-edit-button" onClick={() => setEditingFile(file)}>Edit</button>
                      <button className="photo-remove-button" onClick={() => removeFile(file.id)} aria-label={`Remove ${file.name}`}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="settings-card">
            <div className="settings-title">
              <div>
                <p className="eyebrow">PRINT SERVICE</p>
                <h2>Choose a service</h2>
              </div>
              <span className="live-price">₹{pricePerPage} / page</span>
            </div>

            <div className="service-choice-grid">
              {services.map((item) => (
                <button
                  key={item.id}
                  className={selectedService === item.id ? "service-choice active" : "service-choice"}
                  onClick={() => setSelectedService(item.id)}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.unit}</small>
                  </span>
                  <b>₹{item.price}</b>
                </button>
              ))}
            </div>

            <div className="setting-block">
              <span className="setting-label">Paper size</span>
              <div className="option-grid">
                {(Object.keys(PAPER_LABELS) as PaperSize[]).map((size) => (
                  <button key={size} className={paper === size ? "option active" : "option"} onClick={() => setPaper(size)}>
                    {PAPER_LABELS[size]}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-block copies-row">
              <div>
                <span className="setting-label">Copies</span>
                <span className="setting-help">Same settings for every copy</span>
              </div>
              <div className="stepper">
                <button onClick={() => changeCopies(-1)} aria-label="Decrease copies">−</button>
                <strong>{copies}</strong>
                <button onClick={() => changeCopies(1)} aria-label="Increase copies">+</button>
              </div>
            </div>
          </div>
        </section>

        <aside className="order-summary">
          <div className="summary-inner">
            <div className="summary-top">
              <p className="eyebrow">YOUR ORDER</p>
              <span className="shop-dot">● Shop connected</span>
            </div>

            <div className="summary-line">
              <span>{files.length || 0} photo{files.length !== 1 ? "s" : ""}</span>
              <strong>₹{total}</strong>
            </div>
            <div className="summary-detail">{service?.name} · {copies} cop{copies !== 1 ? "ies" : "y"} · {PAPER_LABELS[paper]}</div>

            <div className="summary-divider" />

            <span className="setting-label">Payment</span>
            <div className="payment-options">
              <button className={payment === "upi" ? "payment active" : "payment"} onClick={() => setPayment("upi")}>
                <span className="payment-icon">₹</span>
                <span><strong>UPI</strong><small>Pay with any UPI app</small></span>
                <span className="radio" />
              </button>
              <button className={payment === "cash" ? "payment active" : "payment"} onClick={() => setPayment("cash")}>
                <span className="payment-icon">▣</span>
                <span><strong>Cash at shop</strong><small>Pay when you collect</small></span>
                <span className="radio" />
              </button>
            </div>

            <div className="total-row">
              <span>Total</span>
              <strong>₹{total}</strong>
            </div>

            <button className="primary-button submit-button" disabled={!files.length} onClick={submitOrder}>
              {sending ? "Creating sandbox order…" : payment === "upi" ? "Continue to mock payment" : "Send sandbox order"}
              <span>→</span>
            </button>

            {!files.length && <p className="hint">Add at least one photo to continue.</p>}
            {submitError && <p className="error-note">{submitError}</p>}
            <p className="privacy-note">Your files are only used for this print order.</p>
          </div>
        </aside>
      </div>

      <footer className="order-footer">
        <span>Shop: {shopSlug}</span>
        <span>Easy Print · Simple phone printing</span>
      </footer>

      {editingFile && (
        <PhotoEditor
          file={editingFile}
          onSave={saveEditedPhoto}
          onClose={() => setEditingFile(null)}
        />
      )}
    </main>
  );
}
