"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
  h1,h2,h3{text-transform:uppercase;letter-spacing:0.02em;}
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;--text-muted:#5A5248;
    --savings:#4ADE80;--font-d:'Anton',sans-serif;--font-b:'DM Sans',sans-serif;
  }
  body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);}
  .pay-card{background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:28px;transition:border-color 0.2s;}
  .pay-card.recommended{border-color:var(--savings);}
  .pay-btn{display:block;width:100%;padding:14px;border:none;border-radius:8px;font-family:var(--font-d);font-size:15px;font-weight:600;cursor:pointer;transition:opacity 0.2s;text-align:center;}
  .pay-btn:hover:not(:disabled){opacity:0.88;}
  .pay-btn:disabled{opacity:0.4;cursor:not-allowed;}
`;

const PACKAGE_LABELS: Record<string, string> = {
  starter_site: "Starter Site",
  full_website: "Full Website",
  brand_and_site: "Brand + Site",
};

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const [intake, setIntake] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<"deposit" | "full" | null>(null);

  useEffect(() => {
    if (!document.getElementById("pay-css")) {
      const s = document.createElement("style"); s.id = "pay-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase.from("intake_forms").select("*").eq("portal_token", id).single()
      .then(({ data }) => { setIntake(data); setLoading(false); });
  }, [id]);

  async function checkout(paymentType: "deposit" | "full") {
    if (!intake) return;
    setProcessing(paymentType);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeId: intake.id, paymentType }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setProcessing(null);
    }
  }

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}>
      <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Loading…</p>
    </div>
  );

  if (!intake) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}>
      <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Not found.</p>
    </div>
  );

  const price = intake.package_price as number;
  const deposit = Math.round(price * 0.5);
  const fullDiscounted = Math.round(price * 0.95);
  const savings = price - fullDiscounted;
  const pkg = intake.package as string;
  const clientName = `${intake.first_name} ${intake.last_name}`.trim();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 10 }}>Wood Fired Designs</p>
          <h1 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Complete Your Payment</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            {clientName} · {PACKAGE_LABELS[pkg]} · ${price.toLocaleString()} total
          </p>
        </div>

        {/* Payment options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>

          {/* Option 1 — Deposit */}
          <div className="pay-card">
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>50% Deposit</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              ${deposit.toLocaleString()}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 22 }}>
              Pay half now to get started. The remaining ${deposit.toLocaleString()} is invoiced at delivery before final files transfer.
            </p>
            <button
              className="pay-btn"
              onClick={() => checkout("deposit")}
              disabled={processing !== null}
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {processing === "deposit" ? "Redirecting…" : "Pay Deposit →"}
            </button>
          </div>

          {/* Option 2 — Full pay */}
          <div className="pay-card recommended">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>Pay in Full</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--savings)", background: "rgba(74,222,128,0.1)", padding: "2px 9px", borderRadius: 99 }}>
                Save ${savings.toLocaleString()}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 800, color: "var(--savings)", marginBottom: 2 }}>
              ${fullDiscounted.toLocaleString()}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              <s style={{ color: "var(--text-muted)" }}>${price.toLocaleString()}</s> · 5% discount applied
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 22 }}>
              Pay everything upfront and save 5%. No balance due at delivery. Files transfer immediately on completion.
            </p>
            <button
              className="pay-btn"
              onClick={() => checkout("full")}
              disabled={processing !== null}
              style={{ background: "var(--savings)", color: "#111" }}
            >
              {processing === "full" ? "Redirecting…" : `Pay $${fullDiscounted.toLocaleString()} & Save →`}
            </button>
          </div>
        </div>

        {/* Trust signals */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {["Secured by Stripe", "256-bit SSL encryption", "No hidden fees", "Cancel anytime before work starts"].map((t) => (
            <p key={t} style={{ fontSize: 12, color: "var(--text-muted)" }}>✓ {t}</p>
          ))}
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <a href={`/portal/${id}`} style={{ fontSize: 12.5, color: "var(--text-muted)", textDecoration: "none" }}>
            ← Back to your portal
          </a>
        </div>
      </div>
    </div>
  );
}
