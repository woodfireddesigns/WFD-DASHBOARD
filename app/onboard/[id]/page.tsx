"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  input[type=text]{width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:var(--font-b);font-size:14px;padding:11px 14px;outline:none;transition:border-color 0.2s;}
  input[type=text]:focus{border-color:var(--accent);}
  input[type=checkbox]{accent-color:var(--accent);width:16px;height:16px;cursor:pointer;}
  .sign-btn{display:block;width:100%;padding:15px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-family:var(--font-d);font-size:15px;font-weight:600;cursor:pointer;transition:opacity 0.2s;}
  .sign-btn:disabled{opacity:0.35;cursor:not-allowed;}
  @media print{.no-print{display:none!important}body{background:#fff!important;color:#111!important}}
`;

const PACKAGE_LABELS: Record<string, string> = {
  starter_site: "Starter Site",
  full_website: "Full Website",
  brand_and_site: "Brand + Site",
};

const PACKAGE_DELIVERABLES: Record<string, string[]> = {
  starter_site: [
    "Single-page website, fully designed and developed",
    "Mobile-optimized and responsive across all devices",
    "Contact form with email notification",
    "Click-to-call button for mobile visitors",
    "Google Business Profile optimization (basic)",
    "Domain connection and hosting setup support",
    "Full ownership — domain, hosting, source files",
  ],
  full_website: [
    "Up to 5 custom-designed pages",
    "Mobile-optimized and responsive across all devices",
    "SEO foundation: meta tags, page structure, sitemap",
    "Contact form with lead capture",
    "Services and portfolio/work pages",
    "Google Analytics 4 + Search Console setup",
    "Domain connection and hosting setup support",
    "Full ownership — domain, hosting, source files",
  ],
  brand_and_site: [
    "Logo design (primary, secondary, favicon variants)",
    "Brand color palette + typography system",
    "Brand guidelines document (PDF)",
    "Vehicle wrap / signage ready files",
    "Up to 5 custom-designed website pages",
    "Mobile-optimized and responsive across all devices",
    "SEO foundation: meta tags, page structure, sitemap",
    "Contact form with lead capture",
    "Google Analytics 4 + Search Console setup",
    "Full ownership — all source files, brand assets, code",
  ],
};

type IntakeRow = Record<string, unknown>;

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [intake, setIntake] = useState<IntakeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (!document.getElementById("contract2-css")) {
      const s = document.createElement("style"); s.id = "contract2-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase.from("intake_forms").select("*").eq("portal_token", id).single()
      .then(({ data }) => { setIntake(data); if (data?.status === "signed") setSigned(true); setLoading(false); });
  }, [id]);

  async function handleSign() {
    if (!signedName.trim() || !agreed || !intake) return;
    setSigning(true);
    const signedAt = new Date().toISOString();
    await supabase.from("intake_forms").update({ status: "signed", signed_name: signedName.trim(), signed_at: signedAt }).eq("id", intake.id);

    // Create invoice
    await supabase.from("invoices").insert({
      client_name: `${intake.first_name} ${intake.last_name}`.trim(),
      company: intake.business_name || null,
      email: intake.email,
      proposal_id: intake.id,
      amount: intake.package_price,
      status: "draft",
      line_items: [{ description: PACKAGE_LABELS[intake.package as string] ?? intake.package, qty: 1, rate: intake.package_price, total: intake.package_price }],
      notes: `Signed by ${signedName.trim()} on ${new Date(signedAt).toLocaleDateString()}`,
    });

    setSigned(true);
    setSigning(false);
    setTimeout(() => router.push(`/portal/${id}`), 1800);
  }

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}>
      <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Loading…</p>
    </div>
  );

  if (!intake) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}>
      <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Contract not found.</p>
    </div>
  );

  const pkg = intake.package as string;
  const price = intake.package_price as number;
  const deposit = Math.round(price * 0.5);
  const clientName = `${intake.first_name} ${intake.last_name}`.trim();
  const deliverables = [
    ...(PACKAGE_DELIVERABLES[pkg] ?? []),
    ...((intake.pages as string[]) ?? []).filter((p) => !["Home", "Contact"].includes(p)).map((p) => `${p} page`),
    ...((intake.integrations as string[]) ?? []).filter((i) => i !== "None needed").map((i) => `Integration: ${i}`),
  ];
  const contractDate = new Date(intake.created_at as string).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>
              Wood Fired Designs
            </p>
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 8 }}>
              Scope of Work &<br />Service Agreement
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Contract #{(intake.id as string).slice(0, 8).toUpperCase()} · {contractDate}</p>
          </div>
          <button className="no-print" onClick={() => window.print()} style={{ padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-b)" }}>
            Print / Save PDF
          </button>
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40 }}>
          {[
            { title: "Service Provider", lines: ["Wood Fired Designs", "Undrafted Designs LLC", "michael@woodfireddesigns.com"] },
            { title: "Client", lines: [clientName, intake.business_name as string, intake.email as string, intake.city ? `${intake.city}${intake.state ? `, ${intake.state}` : ""}` : ""].filter(Boolean) },
          ].map(({ title, lines }) => (
            <div key={title} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>{title}</p>
              {lines.map((l, i) => <p key={i} style={{ fontSize: i === 0 ? 15 : 13, fontWeight: i === 0 ? 700 : 400, fontFamily: i === 0 ? "var(--font-d)" : "var(--font-b)", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", marginBottom: i === 0 ? 4 : 2 }}>{l}</p>)}
            </div>
          ))}
        </div>

        {/* Project Brief */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px", marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>Project Brief</p>
          {[
            ["Primary Goal", intake.primary_goal as string],
            ["Target Customer", intake.target_customer as string],
            ["What Makes You Different", intake.differentiator as string],
            ["Style Direction", ((intake.style_direction as string[]) ?? []).join(", ")],
            ["Launch Timeline", intake.launch_timeline as string],
            ["Platform Preference", intake.platform_pref as string],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label as string} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 3 }}>{label as string}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{val as string}</p>
            </div>
          ))}
        </div>

        {/* Scope of Work */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>Scope of Work — {PACKAGE_LABELS[pkg]}</p>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 3, flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px", marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>Investment</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Total — {PACKAGE_LABELS[pkg]}</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 800, color: "var(--accent)" }}>${price.toLocaleString()}</p>
          </div>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Deposit due to start (50%)</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${deposit.toLocaleString()}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Balance due at delivery (50%)</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>${deposit.toLocaleString()}</p>
          </div>
        </div>

        {/* Terms */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>Terms & Conditions</p>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              ["1. Payment", "A non-refundable 50% deposit is required before any work begins. The remaining 50% balance is due upon project completion, before final files and credentials are transferred. Alternatively, full payment upfront receives a 5% discount. All prices are in USD."],
              ["2. Revisions", "Each deliverable includes two (2) rounds of revisions. Revisions must be submitted as a single consolidated list per round. Additional revision rounds are billed at $150/hour. Scope changes beyond the agreed deliverables require a written amendment."],
              ["3. Client Responsibilities", "The client is responsible for providing all necessary content (copy, images, brand assets, login credentials) within 5 business days of the deposit. Delays in providing materials extend the project timeline accordingly. Wood Fired Designs is not responsible for delays caused by the client."],
              ["4. Timeline", "Project timelines begin when (a) the deposit is received and (b) all required client materials are submitted. Estimated turnaround is based on the selected package and assumes timely client responses. Rush requests are subject to a 25% rush fee."],
              ["5. Intellectual Property", "Upon receipt of final payment, all custom design files, code, and deliverables transfer fully to the client. Wood Fired Designs retains the right to display the completed work in its portfolio and marketing materials unless the client requests otherwise in writing."],
              ["6. Hosting & Domain", "The client is responsible for their own hosting and domain costs unless otherwise agreed in writing. Wood Fired Designs will assist with setup and transfer but does not own or maintain third-party hosting accounts on behalf of clients."],
              ["7. Cancellation", "If the client cancels after work has commenced, the deposit is non-refundable. Any completed work-in-progress may be delivered in its current state at Wood Fired Designs' discretion. If Wood Fired Designs cancels, a full refund of any payments received is issued within 5 business days."],
              ["8. Limitation of Liability", "Wood Fired Designs' total liability shall not exceed the total fees paid under this agreement. Wood Fired Designs is not liable for indirect, incidental, or consequential damages. The client is responsible for backing up all materials and assets."],
              ["9. Governing Law", "This agreement is governed by the laws of the state in which Undrafted Designs LLC is registered. Any disputes shall be resolved through binding arbitration before litigation."],
              ["10. Entire Agreement", "This document constitutes the entire agreement between the parties and supersedes all prior discussions. Amendments must be in writing and agreed upon by both parties."],
            ].map(([title, body]) => (
              <div key={title as string}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5 }}>{title as string}</p>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>{body as string}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div className="no-print">
          {signed ? (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1.5px solid var(--savings)", borderRadius: 12, padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700, color: "var(--savings)", marginBottom: 8 }}>Contract Signed</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                Signed by <strong style={{ color: "var(--text-primary)" }}>{intake.signed_name as string || signedName}</strong>. Redirecting you to your client portal…
              </p>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px", display: "inline-block" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Deposit to start</p>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>${deposit.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>Electronic Signature</p>
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px" }}>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                  By signing below, you confirm you have read and agree to the Scope of Work and all Terms & Conditions above. Your typed name constitutes a legally binding electronic signature under the ESIGN Act.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Full Legal Name *</p>
                  <input type="text" placeholder="Type your full name" value={signedName} onChange={(e) => setSignedName(e.target.value)} />
                </div>
                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 24 }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    I have read and agree to the Scope of Work and all Terms & Conditions. I understand the 50% deposit of <strong style={{ color: "var(--text-primary)" }}>${deposit.toLocaleString()}</strong> is required before work begins.
                  </p>
                </label>
                <button className="sign-btn" disabled={!signedName.trim() || !agreed || signing} onClick={handleSign}>
                  {signing ? "Signing…" : `Sign & Continue → $${deposit.toLocaleString()} deposit due`}
                </button>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
                  You'll be taken to your client portal to complete payment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
