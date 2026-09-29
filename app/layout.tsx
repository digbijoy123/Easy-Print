import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easy Print",
  description: "Simple, fast printing from your phone."
};

const criticalStyles = "* {\n  box-sizing: border-box;\n}\n\nhtml,\nbody {\n  margin: 0;\n  min-height: 100%;\n}\n\nbody {\n  background: #f6f7f9;\n  color: #111827;\n  font-family: Arial, Helvetica, sans-serif;\n}\n\n.shell {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  padding: 24px;\n}\n\n.hero {\n  width: min(720px, 100%);\n}\n\n.badge {\n  display: inline-block;\n  margin-bottom: 18px;\n  padding: 7px 10px;\n  border: 1px solid #d1d5db;\n  border-radius: 999px;\n  background: #fff;\n  font-size: 12px;\n  font-weight: 700;\n  letter-spacing: 0.12em;\n}\n\nh1 {\n  margin: 0;\n  max-width: 650px;\n  font-size: clamp(42px, 9vw, 76px);\n  line-height: 0.98;\n  letter-spacing: -0.05em;\n}\n\n.hero > p {\n  max-width: 620px;\n  margin: 24px 0 0;\n  color: #4b5563;\n  font-size: 18px;\n  line-height: 1.6;\n}\n\n.card {\n  display: flex;\n  gap: 16px;\n  align-items: flex-start;\n  margin-top: 40px;\n  padding: 20px;\n  border: 1px solid #e5e7eb;\n  border-radius: 20px;\n  background: #fff;\n  box-shadow: 0 12px 40px rgba(17, 24, 39, 0.06);\n}\n\n.card-icon {\n  width: 42px;\n  height: 42px;\n  flex: 0 0 42px;\n  display: grid;\n  place-items: center;\n  border-radius: 12px;\n  background: #111827;\n  color: #fff;\n  font-size: 24px;\n}\n\n.card h2 {\n  margin: 2px 0 8px;\n  font-size: 18px;\n}\n\n.card p {\n  margin: 0;\n  color: #6b7280;\n  line-height: 1.5;\n}\n\n\n.sandbox-status {\n  margin: 18px 0;\n  padding: 12px 14px;\n  border-radius: 12px;\n  background: #f2f8f3;\n  color: var(--green);\n  font-size: 11px;\n  font-weight: 800;\n}\n\n.error-note {\n  margin: 10px 0 0;\n  color: #a33b3b;\n  text-align: center;\n  font-size: 11px;\n}\n";

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
        {children}
      </body>
    </html>
  );
}
