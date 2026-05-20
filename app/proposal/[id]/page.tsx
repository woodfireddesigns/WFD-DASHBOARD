"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
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
    --font-d: 'Anton', sans-serif;
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
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
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
    supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProposal(data);
        if (data?.status === "signed") setSigned(true);
        setLoading(false);
      });
  }, [id]);

  async function handleSign() {
    if (!signedName.trim() || !agreed || !proposal) return;
    setSigning(true);
    const signedAt = new Date().toISOString();

    await supabase.from("proposals").update({
      status: "signed",
      signed_name: signedName.trim(),
      signed_at: signedAt,
    }).eq("id", proposal.id);

    // Create invoice row
    await supabase.from("invoices").insert({
      client_name: proposal.client_name,
      company: proposal.company,
      email: proposal.email,
      proposal_id: proposal.id,
      amount: proposal.total,
      status: "draft",
      line_items: proposal.line_items.map((li) => ({
        description: li.label,
        qty: 1,
        rate: li.price,
        total: li.price,
      })),
      notes: `Contract signed by ${signedName.trim()} on ${new Date(signedAt).toLocaleDateString()}`,
    });

    setSigned(true);
    setSigning(false);

    // Scroll to signed confirmation
    setTimeout(() => signRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-b)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading proposal…</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-b)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Proposal not found.</p>
      </div>
    );
  }

  const proposalDate = new Date(proposal.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

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
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
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
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>Service Provider</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Wood Fired Designs</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Undrafted Designs LLC</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>michael@woodfireddesigns.com</p>
          </div>
          <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>Client</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{proposal.client_name}</p>
            {proposal.company && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{proposal.company}</p>}
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{proposal.email}</p>
            {proposal.projected_start && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Start: {proposal.projected_start}</p>
            )}
          </div>
        </div>

        {/* Scope of Work */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 18 }}>
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
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: item.deliverables?.length ? 10 : 0 }}>
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
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>~40% faster turnaround, prioritised in queue.</p>
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
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Subtotal</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>{fmt(proposal.subtotal + proposal.rush_fee)}</p>
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
          <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>
            50% deposit due upon signing · Remainder due at delivery
          </p>
        </div>

        {/* Terms */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 18 }}>
            Terms & Conditions
          </p>
          <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Payment", "A 50% deposit is required before work begins. The remaining balance is due upon project delivery before final files are transferred. Rush fee (if applicable) is included in the deposit amount."],
              ["Revisions", "Each deliverable includes two rounds of revisions. Additional revision rounds are billed at $150/hr. Revisions must be submitted as a single consolidated set per round."],
              ["Timeline", "Project timelines begin on the date the deposit is received and project materials (brand assets, copy, product info) are submitted by the client. Delays in client deliverables extend the timeline accordingly."],
              ["Intellectual Property", "All source files and final deliverables transfer to the client upon receipt of final payment. Wood Fired Designs retains the right to display the work in its portfolio."],
              ["Cancellation", "If the client cancels after work has begun, the deposit is non-refundable. If Wood Fired Designs cancels, a full refund is issued within 5 business days."],
              ["Governing Law", "This agreement is governed by the laws of the state in which Undrafted Designs LLC is registered."],
            ].map(([title, body]) => (
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
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Michael will be in touch within one business day with your deposit invoice and a project kickoff link. Check {proposal.email} for next steps.
              </p>
              <div style={{ marginTop: 24, padding: "14px 18px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Deposit due to start</p>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
                  {fmt(Math.round(proposal.total * 0.5))}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>50% of {fmt(proposal.total)}</p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 18 }}>
                Sign to Agree
              </p>
              <div className="print-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px" }}>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                  By signing below, you agree to the scope of work and terms outlined in this document. Your typed name constitutes a legally binding electronic signature.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Full Legal Name</p>
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
                    I have read and agree to the Scope of Work and Terms & Conditions above. I understand the 50% deposit is due before work begins.
                  </p>
                </label>

                <button
                  className="sign-btn"
                  disabled={!signedName.trim() || !agreed || signing}
                  onClick={handleSign}
                >
                  {signing ? "Signing…" : `Sign & Confirm — ${fmt(proposal.total)} Total`}
                </button>

                <p style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
                  Deposit of {fmt(Math.round(proposal.total * 0.5))} due to start. Invoice sent to {proposal.email}.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
