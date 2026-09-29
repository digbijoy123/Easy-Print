export default function Home() {
  return (
    <main className="landing">
      <div className="landing-glow" />
      <section className="landing-card">
        <div className="brand-mark">EP</div>
        <div className="eyebrow">EASY PRINT</div>
        <h1>Print from your phone. <span>Scan the shop QR.</span></h1>
        <p className="landing-copy">
          Easy Print customer ordering starts from the QR displayed by your print shop.
          Scan that QR with your phone to open the shop-specific ordering page.
        </p>
        <div className="flow-note">
          <span>01</span> Scan shop QR · <span>02</span> Select files · <span>03</span> Send order
        </div>
      </section>
    </main>
  );
}
