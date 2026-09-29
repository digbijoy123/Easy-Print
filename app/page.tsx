import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-glow" />
      <section className="landing-card">
        <div className="brand-mark">EP</div>
        <div className="eyebrow">EASY PRINT</div>
        <h1>Print from your phone. <span>Skip the WhatsApp.</span></h1>
        <p className="landing-copy">
          Scan a shop QR, choose your photos, set the print options, pay, and
          send the order straight to the shop.
        </p>
        <Link className="primary-button landing-button" href="/s/demo">
          Try the customer flow <span>→</span>
        </Link>
        <div className="sandbox-owner">
          <div>
            <strong>Sandbox shop owner</strong>
            <span>Change demo printing services and prices.</span>
          </div>
          <Link href="/admin/demo">Open shop settings →</Link>
        </div>
        <div className="flow-note">
          <span>01</span> Select · <span>02</span> Set options · <span>03</span> Send order
        </div>
      </section>
    </main>
  );
}
