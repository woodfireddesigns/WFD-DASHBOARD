"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

// No browser Supabase client here on purpose: `proposals` is RLS-locked with
// no anon policy, so reads and writes both have to go through the API routes,
// which use the service role key. Signing also creates invoices, which live on
// service-role-only tables.

interface LineItem {
  label: string;
  price: number;
  turnaround?: string;
  description?: string;
  deliverables?: string[];
}

interface Proposal {
  id: string;
  created_at: string;
  client_name: string;
  company: string | null;
  email: string;
  line_items: LineItem[];
  scope_notes: string[] | null;
  rush_fee: number;
  subtotal: number;
  savings: number;
  total: number;
  bundle_label: string | null;
  projected_start: string | null;
  status: string;
  signed_name: string | null;
  signed_at: string | null;
  deposit_amount: number | null;
  deposit_label: string | null;
  contract_pdf_url: string | null;
  stripe_payment_link: string | null;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  h1,h2,h3{text-transform:uppercase;letter-spacing:0.02em;}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #1a1713;
    --bg-surface: #201e1a;
    --bg-elevated: #2a2723;
    --border: #333028;
    --accent: #FF4D00;
    --accent-dim: rgba(255,77,0,0.1);
    --text-primary: #F2EDE8;
    --text-secondary: #9A9088;
    --text-muted: #5A5248;
    --savings: #4ADE80;
    --font-d: 'Oswald', sans-serif;
    --font-b: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.16,1,0.3,1);
  }
  body { background: var(--bg); color: var(--text-primary); font-family: var(--font-b); }
  input[type="text"] {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-family: var(--font-b);
    font-size: 14px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  input[type="text"]:focus { border-color: var(--accent); }
  input[type="checkbox"] { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
  .sign-btn {
    display: block; width: 100%; padding: 15px; background: var(--accent);
    color: #fff; border: none; border-radius: 8px; font-family: var(--font-d);
    font-size: 15px; font-weight: 600; cursor: pointer; letter-spacing: 0.02em;
    transition: opacity 0.2s;
  }
  .sign-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sign-btn:not(:disabled):hover { opacity: 0.88; }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; color: #111 !important; }
    .print-card { background: #fff !important; border-color: #ddd !important; }
  }
`;

function fmt(n: number) {
  return "$" + n.toLocaleString();
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const paid = search.get("paid") === "1";
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const signRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.getElementById("contract-css")) {
      const s = document.createElement("style");
      s.id = "contract-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/proposals/detail?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Proposal | null) => {
        setProposal(data);
        if (data?.status === "signed") {
          setSigned(true);
          setCheckoutUrl(data.stripe_payment_link);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSign() {
    if (!signedName.trim() || !agreed || !proposal) return;
    setSigning(true);
    setSignError(null);

    try {
      const res = await fetch("/api/proposals/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id, signedName: signedName.trim() }),
      });
      const out = await res.json();

      if (!res.ok) {
        setSignError(out.error ?? "Something went wrong. Email michael@woodfireddesigns.com.");
        setSigning(false);
        return;
      }

      setSigned(true);
      setCheckoutUrl(out.checkoutUrl ?? null);

      // Straight to payment. The contract is already executed and invoiced
      // server-side at this point, so a failed redirect costs nothing but a
      // click — the signed state below still shows a Pay button.
      if (out.checkoutUrl) {
        window.location.href = out.checkoutUrl as string;
        return;
      }

      setSigning(false);
      setTimeout(() => signRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setSignError("Network error. Your contract was not submitted — please try again.");
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-b)" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Loading proposal…</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-b)" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Proposal not found.</p>
      </div>
    );
  }

  const proposalDate = new Date(proposal.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Phase-billed proposals set deposit_amount/deposit_label. Everything else
  // keeps the original flat 50% deposit model.
  const phaseBilled = proposal.deposit_amount != null;
  const deposit = proposal.deposit_amount ?? Math.round(proposal.total * 0.5);
  const depositLabel = proposal.deposit_label ?? "50% Project Deposit";
  const dueNote = phaseBilled
    ? `${depositLabel} due to start · Remaining phases invoiced as each one begins`
    : "50% deposit due upon signing · Remainder due at delivery";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>
              Wood Fired Designs
            </p>
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 6 }}>
              Scope of Work &<br />Service Agreement
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10 }}>
              Proposal #{proposal.id.slice(0, 8).toUpperCase()} · {proposalDate}
            </p>
          </div>
          <button
            className="no-print"
            onClick={() => window.print()}
            style={{ padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontFamily: "var(--font-b)", fontSize: 12, cursor: "pointer" }}
          >
            Print / Save PDF
          </button>
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 10 }}>Service Provider</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Wood Fired Designs</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Undrafted Designs LLC</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>michael@woodfireddesigns.com</p>
          </div>
          <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 10 }}>Client</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{proposal.client_name}</p>
            {proposal.company && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{proposal.company}</p>}
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{proposal.email}</p>
            {proposal.projected_start && (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>Start: {proposal.projected_start}</p>
            )}
          </div>
        </div>

        {/* Scope of Work */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 18 }}>
            Scope of Work — Deliverables
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {proposal.line_items.map((item, i) => (
              <div key={i} className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</p>
                    {item.turnaround && (
                      <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 500, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99 }}>
                        {item.turnaround}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
                    {fmt(item.price)}
                  </p>
                </div>
                {item.description && (
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: item.deliverables?.length ? 10 : 0 }}>
                    {item.description}
                  </p>
                )}
                {item.deliverables && item.deliverables.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {item.deliverables.map((d, di) => (
                      <div key={di} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{d}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {proposal.rush_fee > 0 && (
              <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Rush Delivery Fee</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>~40% faster turnaround, prioritised in queue.</p>
                </div>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 700, color: "var(--text-secondary)" }}>
                  +{fmt(proposal.rush_fee)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px", marginBottom: 40 }}>
          {proposal.bundle_label && proposal.savings > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Subtotal</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace" }}>{fmt(proposal.subtotal + proposal.rush_fee)}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "var(--savings)" }}>{proposal.bundle_label} discount</p>
                <p style={{ fontSize: 13, color: "var(--savings)", fontFamily: "monospace" }}>−{fmt(proposal.savings)}</p>
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Total Investment</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 32, fontWeight: 800, color: "var(--accent)" }}>{fmt(proposal.total)}</p>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 8 }}>
            {dueNote}
          </p>
        </div>

        {/* Terms */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 18 }}>
            Terms & Conditions
          </p>
          <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {(phaseBilled
              ? [
                  ["Payment", "Payment is collected per phase. Each phase is invoiced and funded before that phase begins; no phase starts until the prior one is approved. Work outside the agreed scope is billed at $75/hr."],
                  ["Revisions", "Each deliverable includes two rounds of revisions. Additional revision rounds are billed at $75/hr. Revisions must be submitted as a single consolidated set per round."],
                  ["Timeline", "Project timelines begin on the date the first phase payment is received and project materials (brand assets, copy, product info) are submitted by the client. Delays in client deliverables extend the timeline accordingly."],
                  ["Intellectual Property", "All source files and final deliverables transfer to the client upon receipt of final payment for the relevant phase. Wood Fired Designs retains the right to display the work in its portfolio."],
                  ["Regulatory Copy", "Nutrition, ingredient and allergen panels are typeset to copy supplied and approved by the client or its co-packer. Wood Fired Designs does not author, verify or legally clear regulatory content."],
                  ["Cancellation", "If the client cancels after a phase has begun, that phase's payment is non-refundable. Unstarted phases are refunded in full. If Wood Fired Designs cancels, a full refund of unstarted work is issued within 5 business days."],
                  ["Governing Law", "This agreement is governed by the laws of the state in which Undrafted Designs LLC is registered."],
                ]
              : [
                  ["Payment", "A 50% deposit is required before work begins. The remaining balance is due upon project delivery before final files are transferred. Rush fee (if applicable) is included in the deposit amount."],
                  ["Revisions", "Each deliverable includes two rounds of revisions. Additional revision rounds are billed at $150/hr. Revisions must be submitted as a single consolidated set per round."],
                  ["Timeline", "Project timelines begin on the date the deposit is received and project materials (brand assets, copy, product info) are submitted by the client. Delays in client deliverables extend the timeline accordingly."],
                  ["Intellectual Property", "All source files and final deliverables transfer to the client upon receipt of final payment. Wood Fired Designs retains the right to display the work in its portfolio."],
                  ["Cancellation", "If the client cancels after work has begun, the deposit is non-refundable. If Wood Fired Designs cancels, a full refund is issued within 5 business days."],
                  ["Governing Law", "This agreement is governed by the laws of the state in which Undrafted Designs LLC is registered."],
                ]
            ).map(([title, body]) => (
              <div key={title}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div ref={signRef} className="no-print">
          {signed ? (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1.5px solid var(--savings)", borderRadius: 12, padding: "28px 28px", textAlign: "center" }}>
              <p style={{ fontSize: 28, marginBottom: 12 }}>✓</p>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 700, color: "var(--savings)", marginBottom: 8 }}>Contract Signed</p>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16 }}>
                Signed by <strong style={{ color: "var(--text-primary)" }}>{proposal.signed_name || signedName}</strong>
                {proposal.signed_at && ` on ${new Date(proposal.signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`}.
              </p>
              {paid ? (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Payment received. Michael will be in touch within one business day to kick off {depositLabel.toLowerCase()}. A receipt is on its way to {proposal.email}.
                </p>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  One more step: fund {depositLabel.toLowerCase()} below and work begins. A copy of the executed agreement is on its way to {proposal.email}.
                </p>
              )}

              <div style={{ marginTop: 24, padding: "16px 18px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                  {paid ? "Paid" : "Due to start"} · {depositLabel}
                </p>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
                  {fmt(deposit)}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 4 }}>
                  {phaseBilled
                    ? `of ${fmt(proposal.total)} total · remaining phases invoiced as each begins`
                    : `50% of ${fmt(proposal.total)}`}
                </p>

                {!paid && checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    className="sign-btn"
                    style={{ marginTop: 16, textDecoration: "none", textAlign: "center" }}
                  >
                    Pay {fmt(deposit)} &amp; Start
                  </a>
                )}
                {!paid && !checkoutUrl && (
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.6 }}>
                    Your invoice is being prepared and will arrive at {proposal.email} shortly.
                  </p>
                )}
              </div>

              {proposal.contract_pdf_url && (
                <a
                  href={proposal.contract_pdf_url}
                  target="_blank"
                  rel="noopener"
                  style={{ display: "inline-block", marginTop: 16, fontSize: 12.5, color: "var(--text-secondary)", textDecoration: "underline" }}
                >
                  Download the signed agreement (PDF)
                </a>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 18 }}>
                Sign to Agree
              </p>
              <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px" }}>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                  By signing below, you agree to the scope of work and terms outlined in this document. Your typed name constitutes a legally binding electronic signature.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Full Legal Name</p>
                  <input
                    type="text"
                    placeholder="Type your full name"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                  />
                </div>

                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 24 }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    I have read and agree to the Scope of Work and Terms &amp; Conditions above. I understand {phaseBilled ? `${depositLabel.toLowerCase()} is due before work begins` : "the 50% deposit is due before work begins"}.
                  </p>
                </label>

                <button
                  className="sign-btn"
                  disabled={!signedName.trim() || !agreed || signing}
                  onClick={handleSign}
                >
                  {signing ? "Signing…" : `Sign & Pay ${fmt(deposit)} to Start`}
                </button>

                {signError && (
                  <p style={{ fontSize: 12.5, color: "#F87171", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                    {signError}
                  </p>
                )}

                <p style={{ fontSize: 11.5, color: "var(--text-secondary)", textAlign: "center", marginTop: 10 }}>
                  Signing takes you straight to checkout for {fmt(deposit)}. Total contract value {fmt(proposal.total)}.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
