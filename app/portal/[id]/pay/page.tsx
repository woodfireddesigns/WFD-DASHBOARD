"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  h1,h2,h3{text-transform:uppercase;letter-spacing:0.02em;}
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;--text-muted:#5A5248;
    --savings:#4ADE80;--font-d:'Oswald',sans-serif;--font-b:'DM Sans',sans-serif;
  }
  body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);}
  .pay-card{background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:28px;transition:border-color 0.2s;}
  .pay-card.recommended{border-color:var(--savings);}
  .pay-btn{display:block;width:100%;padding:14px;border:none;border-radius:8px;font-family:var(--font-b);font-size:15px;font-weight:600;cursor:pointer;transition:opacity 0.2s;text-align:center;}
  .pay-btn:hover:not(:disabled){opacity:0.88;}
  .pay-btn:disabled{opacity:0.4;cursor:not-allowed;}
`;

const PACKAGE_LABELS: Record<string, string> = {
  starter_site:        "Starter Site",
  full_website:        "Full Website",
  brand_and_site:      "Brand + Site",
  test_package:        "Test Package",
  pp_brand_foundation: "Brand Foundation",
  pp_full_system:      "Full System",
  pp_pitch_deck:       "Pitch Deck",
  pp_bundle:           "Full System + Pitch Deck Bundle",
};

const BASE_PRICES: Record<string, number> = {
  starter_site:        1200,
  full_website:        2400,
  brand_and_site:      4200,
  test_package:        19,
  pp_brand_foundation: 3500,
  pp_full_system:      4300,
  pp_pitch_deck:       1500,
  pp_bundle:           5550,
};

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const [intake, setIntake] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<"deposit" | "full" | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

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

  async function checkout(paymentType: "deposit" | "full", paymentMethod: "card" | "bank" = "card") {
    if (!intake) return;
    setProcessing(paymentType);
    setStripeError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeId: intake.id, paymentType, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? `Server error ${res.status}`);
      if (!data.url) throw new Error("No checkout URL returned from Stripe.");
      window.open(data.url, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStripeError(msg);
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

  const storedPrice = intake.package_price as number;
  const price = storedPrice > 0 ? storedPrice : (BASE_PRICES[intake.package as string] ?? 0);
  const deposit = Math.round(price * 0.5);
  const fullDiscounted = Math.round(price * 0.95);
  const savings = price - fullDiscounted;

  function cardFee(amount: number): number {
    return Math.round(((amount + 0.30) / (1 - 0.029)) * 100) / 100 - amount;
  }
  const depositFee = Math.round(cardFee(deposit));
  const fullFee = Math.round(cardFee(fullDiscounted));
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
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 14 }}>50% Deposit</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              ${deposit.toLocaleString()}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 22 }}>
              Pay half now to get started. The remaining ${deposit.toLocaleString()} is invoiced at delivery before final files transfer.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="pay-btn" onClick={() => checkout("deposit", "card")} disabled={processing !== null} style={{ background: "var(--accent)", color: "#fff" }}>
                {processing === "deposit" ? "Redirecting…" : `Pay by Card (+$${depositFee} fee) →`}
              </button>
              <button className="pay-btn" onClick={() => checkout("deposit", "bank")} disabled={processing !== null} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13 }}>
                Pay by Bank Transfer (no card fee)
              </button>
            </div>
          </div>

          {/* Option 2 — Full pay */}
          <div className="pay-card recommended">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Pay in Full</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--savings)", background: "rgba(74,222,128,0.1)", padding: "2px 9px", borderRadius: 99 }}>
                Save ${savings.toLocaleString()}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 800, color: "var(--savings)", marginBottom: 2 }}>
              ${fullDiscounted.toLocaleString()}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
              <s style={{ color: "var(--text-secondary)" }}>${price.toLocaleString()}</s> · 5% discount applied
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 22 }}>
              Pay everything upfront and save 5%. No balance due at delivery. Files transfer immediately on completion.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="pay-btn" onClick={() => checkout("full", "card")} disabled={processing !== null} style={{ background: "var(--savings)", color: "#111" }}>
                {processing === "full" ? "Redirecting…" : `Pay $${fullDiscounted.toLocaleString()} by Card (+$${fullFee} fee) →`}
              </button>
              <button className="pay-btn" onClick={() => checkout("full", "bank")} disabled={processing !== null} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13 }}>
                Pay by Bank Transfer (no card fee)
              </button>
            </div>
          </div>
        </div>

        {/* Stripe error */}
        {stripeError && (
          <div style={{ background: "rgba(184,50,50,0.12)", border: "1px solid #B83232", borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#E87070", fontWeight: 500, marginBottom: 4 }}>Payment setup failed</p>
            <p style={{ fontSize: 12.5, color: "#C87070", lineHeight: 1.6 }}>{stripeError}</p>
          </div>
        )}

        {/* Trust signals */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {["Secured by Stripe", "256-bit SSL encryption", "No hidden fees", "Cancel anytime before work starts"].map((t) => (
            <p key={t} style={{ fontSize: 12, color: "var(--text-secondary)" }}>✓ {t}</p>
          ))}
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <a href={`/portal/${id}`} style={{ fontSize: 12.5, color: "var(--text-secondary)", textDecoration: "none" }}>
            ← Back to your portal
          </a>
        </div>
      </div>
    </div>
  );
}
