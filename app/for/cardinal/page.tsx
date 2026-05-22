"use client";
import { useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;
    --font-d:'Anton',sans-serif;--font-b:'DM Sans',sans-serif;
  }
  html,body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);-webkit-font-smoothing:antialiased;}
  h1,h2,h3{font-family:var(--font-d);text-transform:uppercase;letter-spacing:0.02em;line-height:1.05;}
  .cta-btn{display:inline-block;padding:16px 36px;background:var(--accent);color:#fff;border-radius:8px;font-family:var(--font-b);font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.03em;transition:opacity 0.2s;}
  .cta-btn:hover{opacity:0.88;}
  .deliverable{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;}
  .deliverable span{color:var(--accent);font-size:11px;margin-top:3px;flex-shrink:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  .fade-up{animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;}
  .fade-up-2{animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;}
  .fade-up-3{animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both;}
  .fade-up-4{animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.45s both;}
`;

const deliverables = [
  "Logo system — primary, secondary, and submark variants",
  "Color palette — 5 colors with usage rules and hex/Pantone values",
  "Typography system — 2 fonts, hierarchy defined",
  "Basic brand usage guide — how and where to apply everything",
  "3 social media profile assets — ready to upload",
  "3 launch graphics — announcements, covers, or banners",
  "All file formats — PNG, SVG, PDF in white, black, and full-color",
];

const why = [
  { label: "You own everything", body: "Every file, every font, every asset. No subscriptions, no licensing fees, no asking permission to use your own brand." },
  { label: "One person, start to finish", body: "Michael does the work — not a project manager who delegates to a junior designer you've never met. Every decision comes directly from him." },
  { label: "Built for where you're going", body: "This isn't a logo. It's a foundation — color, type, mark, and guidelines — designed to scale with Cardinal as you grow." },
  { label: "Fast turnaround", body: "2 weeks from deposit to delivery. Contained scope, no scope creep, no waiting around." },
];

export default function CardinalProposal() {
  useEffect(() => {
    if (document.getElementById("cardinal-css")) return;
    const s = document.createElement("style"); s.id = "cardinal-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header bar */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontFamily: "var(--font-d)", fontSize: 13, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Wood Fired Designs</p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Prepared for Ben Munoz — Cardinal</p>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div className="fade-up">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 16 }}>
            Brand Identity Proposal
          </p>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", color: "var(--text-primary)", marginBottom: 24, lineHeight: 1.05 }}>
            Let's Build<br />Cardinal's Brand.
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: 560, marginBottom: 40 }}>
            Hey Ben — this is the foundation we talked about. Everything Cardinal needs to show up professionally, consistently, and with intent. One package, two weeks, and you own everything when it's done.
          </p>
          <a href="https://wfd-dashboard.vercel.app/design" className="cta-btn">
            Start Your Brand Questionnaire →
          </a>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 12 }}>
            Takes about 8 minutes. Your brief builds as you go.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
      </div>

      {/* Package */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px" }}>
        <div className="fade-up-2" style={{ background: "var(--bg-surface)", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "36px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>Your Package</p>
              <h2 style={{ fontSize: 32, color: "var(--text-primary)", marginBottom: 6 }}>Spark Identity</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>A real brand — not just a logo. Fast, contained, built to last.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 48, color: "var(--accent)", lineHeight: 1 }}>$1,200</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>2-week delivery · 50% deposit to start</p>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "28px 0" }} />

          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 16 }}>What You Get</p>
          {deliverables.map((d, i) => (
            <div key={i} className="deliverable">
              <span>✦</span>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55 }}>{d}</p>
            </div>
          ))}

          <div style={{ marginTop: 32 }}>
            <a href="https://wfd-dashboard.vercel.app/design" className="cta-btn">
              Start the Questionnaire →
            </a>
          </div>
        </div>
      </div>

      {/* Why WFD */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 32px 60px" }}>
        <div className="fade-up-3">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 28 }}>Why Wood Fired Designs</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {why.map(({ label, body }) => (
              <div key={label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px" }}>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 16, color: "var(--text-primary)", marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's next */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 32px 60px" }}>
        <div className="fade-up-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "28px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 16 }}>How It Works</p>
          {[
            ["01 — Fill out the questionnaire", "8 minutes. Tells us everything we need about Cardinal's direction, audience, and style."],
            ["02 — Review your contract", "We'll generate a full scope of work based on your answers. Review, sign, and you're in."],
            ["03 — Pay the deposit", "50% ($600) gets you officially in the queue. Balance due at delivery."],
            ["04 — We build. You approve.", "Two rounds of revisions. Two weeks. Then everything ships to your inbox."],
          ].map(([step, desc]) => (
            <div key={step as string} style={{ display: "flex", gap: 20, marginBottom: 18, alignItems: "flex-start" }}>
              <div style={{ width: 2, background: "var(--accent)", flexShrink: 0, marginTop: 4, alignSelf: "stretch", minHeight: 40, display: "none" }} />
              <div>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>{step as string}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc as string}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <a href="https://wfd-dashboard.vercel.app/design" className="cta-btn">
              Let's Build Cardinal's Brand →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Wood Fired Designs · Undrafted Designs LLC</p>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="mailto:michael@woodfireddesigns.com" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}>michael@woodfireddesigns.com</a>
          <a href="https://woodfireddesigns.com" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}>woodfireddesigns.com</a>
        </div>
      </div>

    </div>
  );
}
