"use client";

import { ChangeEvent, useMemo, useState } from "react";

type PrintColor = "color" | "bw";
type PaperSize = "A4" | "A5" | "4x6";
type Payment = "upi" | "cash";

type PrintFile = {
  id: string;
  name: string;
  url: string;
};

const SHOP = {
  name: "Demo Print Shop",
  location: "Easy Print Demo",
  colorPrice: 10,
  bwPrice: 5,
};

const PAPER_LABELS: Record<PaperSize, string> = {
  A4: "A4",
  A5: "A5",
  "4x6": '4 × 6"',
};

export default function PrintOrder({ shopSlug }: { shopSlug: string }) {
  const [files, setFiles] = useState<PrintFile[]>([]);
  const [color, setColor] = useState<PrintColor>("color");
  const [paper, setPaper] = useState<PaperSize>("A4");
  const [copies, setCopies] = useState(1);
  const [payment, setPayment] = useState<Payment>("upi");
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pricePerPage = color === "color" ? SHOP.colorPrice : SHOP.bwPrice;
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

  function changeCopies(delta: number) {
    setCopies((value) => Math.min(99, Math.max(1, value + delta)));
  }

  function submitOrder() {
    if (!files.length) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="order-shell">
        <section className="success-card">
          <div className="success-icon">✓</div>
          <p className="eyebrow">ORDER READY</p>
          <h1>Your order has been sent.</h1>
          <p>
            Show the shop your order status if needed. The print shop can now
            process your files with the selected settings.
          </p>
          <div className="order-ticket">
            <div>
              <span>Shop</span>
              <strong>{SHOP.name}</strong>
            </div>
            <div>
              <span>Files</span>
              <strong>{files.length} photo{files.length !== 1 ? "s" : ""}</strong>
            </div>
            <div>
              <span>Print</span>
              <strong>{copies} copy · {color === "color" ? "Colour" : "B&W"} · {PAPER_LABELS[paper]}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>₹{total}</strong>
            </div>
          </div>
          <button className="secondary-button" onClick={() => setSubmitted(false)}>
            Back to order
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="order-shell">
      <header className="shop-header">
        <div className="brand-mark small">EP</div>
        <div>
          <strong>{SHOP.name}</strong>
          <span>{SHOP.location}</span>
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
                  <span>Tap a photo to remove it</span>
                </div>
                <label className="add-more">
                  + Add more
                  <input type="file" accept="image/*" multiple onChange={handleFiles} />
                </label>
              </div>

              <div className="preview-grid">
                {files.map((file) => (
                  <button className="preview-card" key={file.id} onClick={() => removeFile(file.id)} title={`Remove ${file.name}`}>
                    <img src={file.url} alt="" />
                    <span className="remove-dot">×</span>
                  </button>
                ))}
              </div>

              <button className="edit-link" onClick={() => setEditing((value) => !value)}>
                ✦ {editing ? "Hide editing tools" : "Optional: basic editing"}
              </button>

              {editing && (
                <div className="editing-panel">
                  <strong>Basic editing</strong>
                  <span>Crop, rotate and adjustments will be connected here next.</span>
                  <div className="tool-row">
                    <button disabled>Crop</button>
                    <button disabled>Rotate</button>
                    <button disabled>Adjust</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="settings-card">
            <div className="settings-title">
              <div>
                <p className="eyebrow">PRINT SETTINGS</p>
                <h2>Choose how it should print</h2>
              </div>
              <span className="live-price">₹{pricePerPage} / page</span>
            </div>

            <div className="setting-block">
              <span className="setting-label">Colour</span>
              <div className="segmented">
                <button className={color === "color" ? "active" : ""} onClick={() => setColor("color")}>
                  <span className="color-dots">●●●</span> Colour <small>₹{SHOP.colorPrice}</small>
                </button>
                <button className={color === "bw" ? "active" : ""} onClick={() => setColor("bw")}>
                  <span className="bw-dot">●</span> Black &amp; White <small>₹{SHOP.bwPrice}</small>
                </button>
              </div>
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
            <div className="summary-detail">
              {copies} cop{copies !== 1 ? "ies" : "y"} · {color === "color" ? "Colour" : "B&W"} · {PAPER_LABELS[paper]}
            </div>

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
              {payment === "upi" ? "Continue to payment" : "Send order"}
              <span>→</span>
            </button>

            {!files.length && <p className="hint">Add at least one photo to continue.</p>}
            <p className="privacy-note">Your files are only used for this print order.</p>
          </div>
        </aside>
      </div>

      <footer className="order-footer">
        <span>Shop: {shopSlug}</span>
        <span>Easy Print · Simple phone printing</span>
      </footer>
    </main>
  );
}
