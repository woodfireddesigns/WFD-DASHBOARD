"use client";
import { useEffect, useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --black:  #080808;
    --ink:    #111111;
    --card:   #141414;
    --border: #222222;
    --pink:   #FF2D9B;
    --blue:   #1B4FFF;
    --yellow: #FFE600;
    --white:  #FFFFFF;
    --muted:  #666666;
    --font-d: 'Oswald', 'Arial Narrow', sans-serif;
    --font-b: 'DM Sans', sans-serif;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--black); color: var(--white); font-family: var(--font-b); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

  /* ── Nav ── */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; mix-blend-mode: normal; }
  .nav-logo { font-family: var(--font-d); font-size: 13px; letter-spacing: 0.2em; color: var(--white); text-transform: uppercase; opacity: 0.5; }
  .nav-cta { font-size: 12px; font-weight: 600; color: var(--pink); letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; border: 1px solid var(--pink); padding: 8px 18px; border-radius: 2px; transition: background 0.2s, color 0.2s; }
  .nav-cta:hover { background: var(--pink); color: var(--black); }

  /* ── Hero ── */
  .hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 48px 80px; position: relative; overflow: hidden; }
  .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(27,79,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(255,45,155,0.08) 0%, transparent 60%); pointer-events: none; }
  .hero-eyebrow { font-family: var(--font-b); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; }
  .hero-name { font-family: var(--font-d); font-size: clamp(72px, 12vw, 180px); line-height: 0.9; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); margin-bottom: 0; }
  .hero-name span { color: var(--pink); }
  .hero-tagline { font-family: var(--font-b); font-size: clamp(16px, 2vw, 22px); font-weight: 300; font-style: italic; color: rgba(255,255,255,0.45); margin-top: 28px; max-width: 560px; line-height: 1.5; }
  .hero-rule { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, var(--pink), var(--blue), transparent); }

  /* ── Sections ── */
  section { padding: 100px 48px; }
  .section-label { font-size: 10px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: var(--muted); margin-bottom: 48px; display: flex; align-items: center; gap: 16px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* ── The brand section ── */
  .brand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
  .brand-truth { background: var(--card); padding: 52px 48px; }
  .brand-truth-large { grid-column: 1 / -1; background: var(--ink); padding: 64px 48px; border-left: 3px solid var(--pink); }
  .brand-quote { font-family: var(--font-d); font-size: clamp(28px, 4vw, 56px); text-transform: uppercase; line-height: 1.0; letter-spacing: 0.01em; color: var(--white); }
  .brand-quote em { color: var(--pink); font-style: normal; }
  .brand-body { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.8; font-weight: 300; margin-top: 20px; max-width: 480px; }
  .truth-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
  .truth-value { font-family: var(--font-d); font-size: clamp(22px, 3vw, 36px); text-transform: uppercase; letter-spacing: 0.02em; color: var(--white); line-height: 1.1; }
  .truth-value.pink { color: var(--pink); }
  .truth-value.blue { color: #5B7FFF; }
  .truth-value.yellow { color: var(--yellow); }

  /* ── Recommendation ── */
  .rec-wrap { background: var(--ink); padding: 0; overflow: hidden; }
  .rec-header { background: var(--pink); padding: 40px 48px; display: flex; justify-content: space-between; align-items: flex-end; }
  .rec-title { font-family: var(--font-d); font-size: clamp(36px, 6vw, 80px); text-transform: uppercase; color: var(--black); line-height: 0.95; letter-spacing: 0.01em; }
  .rec-price { font-family: var(--font-d); font-size: clamp(48px, 6vw, 96px); color: var(--black); letter-spacing: -0.02em; line-height: 1; }
  .rec-body { padding: 52px 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  .rec-why h3 { font-family: var(--font-d); font-size: 22px; text-transform: uppercase; color: var(--white); margin-bottom: 16px; letter-spacing: 0.04em; }
  .rec-why p { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.8; font-weight: 300; }
  .rec-why p + p { margin-top: 14px; }
  .rec-why strong { color: var(--white); font-weight: 500; }

  /* ── Deliverables ── */
  .del-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
  .del-item { background: var(--card); padding: 36px 32px; transition: background 0.2s; }
  .del-item:hover { background: var(--ink); }
  .del-num { font-family: var(--font-d); font-size: 11px; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 20px; }
  .del-title { font-family: var(--font-d); font-size: clamp(18px, 2.5vw, 26px); text-transform: uppercase; color: var(--white); line-height: 1.1; margin-bottom: 10px; letter-spacing: 0.02em; }
  .del-body { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.7; font-weight: 300; }
  .del-accent { display: inline-block; width: 28px; height: 2px; margin-bottom: 16px; }

  /* ── Solo Club specifics ── */
  .specifics { background: var(--ink); padding: 52px 48px; margin-top: 2px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
  .spec-item { padding: 32px; border-left: 2px solid var(--border); }
  .spec-item:first-child { border-color: var(--pink); }
  .spec-item:nth-child(2) { border-color: var(--blue); }
  .spec-item:nth-child(3) { border-color: var(--yellow); }
  .spec-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .spec-value { font-family: var(--font-d); font-size: 18px; text-transform: uppercase; color: var(--white); letter-spacing: 0.03em; }

  /* ── Timeline ── */
  .timeline { display: flex; gap: 2px; }
  .tl-step { flex: 1; background: var(--card); padding: 32px 28px; position: relative; }
  .tl-step::after { content: attr(data-num); position: absolute; top: 24px; right: 24px; font-family: var(--font-d); font-size: 48px; color: var(--border); line-height: 1; }
  .tl-week { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .tl-phase { font-family: var(--font-d); font-size: 20px; text-transform: uppercase; color: var(--white); margin-bottom: 8px; }
  .tl-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6; font-weight: 300; }

  /* ── CTA ── */
  .cta-section { min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 100px 48px; position: relative; overflow: hidden; }
  .cta-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,45,155,0.08) 0%, transparent 70%); }
  .cta-headline { font-family: var(--font-d); font-size: clamp(52px, 9vw, 130px); text-transform: uppercase; line-height: 0.9; letter-spacing: 0.01em; color: var(--white); margin-bottom: 32px; position: relative; }
  .cta-headline span { color: var(--pink); }
  .cta-sub { font-size: 16px; color: rgba(255,255,255,0.4); font-weight: 300; max-width: 440px; line-height: 1.7; margin-bottom: 52px; position: relative; }
  .cta-buttons { display: flex; gap: 14px; position: relative; }
  .btn-primary { display: inline-block; padding: 18px 48px; background: var(--pink); color: var(--black); font-family: var(--font-b); font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,45,155,0.3); }
  .btn-secondary { display: inline-block; padding: 18px 48px; background: transparent; color: var(--white); font-family: var(--font-b); font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: border-color 0.2s, color 0.2s; }
  .btn-secondary:hover { border-color: var(--white); }

  /* ── Footer ── */
  .footer { padding: 32px 48px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .footer-logo { font-family: var(--font-d); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
  .footer-links { display: flex; gap: 28px; }
  .footer-links a { font-size: 12px; color: var(--muted); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; }
  .footer-links a:hover { color: var(--white); }

  /* ── Animations ── */
  .fade-up { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-up-2 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  .fade-up-3 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
  @keyframes fadeUp { from { opacity:0; transform: translateY(32px); } to { opacity:1; transform: none; } }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .nav { padding: 20px 24px; }
    .hero { padding: 0 24px 64px; }
    section { padding: 72px 24px; }
    .brand-grid { grid-template-columns: 1fr; }
    .brand-truth-large { grid-column: 1; }
    .rec-body { grid-template-columns: 1fr; gap: 32px; }
    .del-grid { grid-template-columns: 1fr; }
    .specifics { grid-template-columns: 1fr 1fr; }
    .timeline { flex-direction: column; }
    .cta-buttons { flex-direction: column; }
    .footer { flex-direction: column; gap: 20px; text-align: center; }
    .footer-links { flex-wrap: wrap; justify-content: center; }
    .rec-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  }
`;

export default function SoloClubProposal() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (document.getElementById("solo-css")) return;
    const s = document.createElement("style"); s.id = "solo-css"; s.textContent = CSS;
    document.head.appendChild(s);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>

      {/* Nav */}
      <nav className="nav" style={{ background: scrolled ? "rgba(8,8,8,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid #1a1a1a" : "none", transition: "all 0.3s" }}>
        <span className="nav-logo">Wood Fired Designs</span>
        <a href="https://calendly.com/woodfireddesigns/discovery" target="_blank" rel="noopener noreferrer" className="nav-cta">Schedule a Call</a>
      </nav>

      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <p className="hero-eyebrow fade-up">Prepared for Kyle Richardson · Brand Identity Proposal</p>
        <h1 className="hero-name fade-up-2">
          The<br />
          Solo<br />
          <span>Club.</span>
        </h1>
        <p className="hero-tagline fade-up-3">
          For the miles between who you were<br />and who you&apos;re becoming.
        </p>
        <div className="hero-rule" />
      </div>

      {/* The Brand */}
      <section style={{ padding: 0 }}>
        <div style={{ padding: "80px 48px 40px" }}>
          <p className="section-label">We read everything</p>
        </div>
        <div className="brand-grid">
          <div className="brand-truth-large">
            <p className="brand-quote">
              Running is a solo sport.<br />
              <em>Elevating your life</em><br />
              is a solo effort.
            </p>
            <p className="brand-body">
              But both are better done with a strong community beside you. That tension — between the personal work of becoming and the power of belonging — is the most compelling brand paradox we&apos;ve seen in years. Kyle, you&apos;ve already done the hard part. You know exactly who this brand is for, what it believes, and where it draws the line. Our job is to make it look as good as it thinks.
            </p>
          </div>
          {[
            { label: "Brand Personality", value: "Friendly.\nInclusive.\nFun.", accent: "white" },
            { label: "Brand Truth", value: "Nothing to prove.", accent: "pink" },
            { label: "Community first.", value: "Apparel second.", accent: "blue" },
            { label: "The tagline that hits", value: "Built for what's next.", accent: "yellow" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="brand-truth">
              <p className="truth-label">{label}</p>
              <p className={`truth-value ${accent}`} style={{ whiteSpace: "pre-line" }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation */}
      <section style={{ padding: "80px 48px 0" }}>
        <p className="section-label">Our recommendation</p>
        <div className="rec-wrap">
          <div className="rec-header">
            <div>
              <p style={{ fontFamily: "var(--font-b)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.5)", marginBottom: 10 }}>
                The right package for The Solo Club
              </p>
              <h2 className="rec-title">Ignite<br />Brand<br />System</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-b)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(0,0,0,0.5)", marginBottom: 6 }}>Investment</p>
              <p className="rec-price">$3,500</p>
              <p style={{ fontFamily: "var(--font-b)", fontSize: 12, color: "rgba(0,0,0,0.5)", marginTop: 6 }}>4–6 weeks · 50% to start</p>
            </div>
          </div>
          <div className="rec-body">
            <div className="rec-why">
              <h3>Why not Spark?</h3>
              <p>Spark is built for brands that need a logo and a foundation. The Solo Club already has something more valuable — a complete narrative, a defined audience, and a clear emotional truth. A single-page brand guide won&apos;t hold this together as it scales.</p>
              <p>When The Solo Club starts showing up on hats, tees, shorts, embroidery, social, and eventually retail — and it will — you need a system that stays consistent without you personally policing it. <strong>That&apos;s what Ignite is built for.</strong></p>
            </div>
            <div className="rec-why">
              <h3>Why Ignite is right.</h3>
              <p>The color direction alone — hot pink, electric blue, yellow — is a bold three-color system that needs to be built properly. Done wrong it&apos;s a circus. Done right it&apos;s goodr-level iconic.</p>
              <p>The logo concept — the beat-up winged running shoe — is smart but delicate. <strong>Execution is everything.</strong> Ignite gives us the space to explore directions, find the one that works across hat embroidery and a 1-inch app icon, and build the system around it correctly.</p>
              <p>The 20–30 page brand guidelines aren&apos;t bureaucracy. They&apos;re the manual that lets The Solo Club grow without losing itself.</p>
            </div>
          </div>
        </div>

        {/* Solo Club specifics */}
        <div className="specifics">
          {[
            { label: "Hat-ready logomark", value: "Built to embroider at 1 inch", color: "#FF2D9B" },
            { label: "3-color system", value: "Pink · Blue · Yellow — done right", color: "#5B7FFF" },
            { label: "Merch-first thinking", value: "Every decision considers wearability", color: "#FFE600" },
            { label: "Community-scale guidelines", value: "20–30 pages built to last", color: "#666" },
          ].map(({ label, value, color }) => (
            <div key={label} className="spec-item" style={{ borderLeftColor: color }}>
              <p className="spec-label">{label}</p>
              <p className="spec-value" style={{ fontSize: 15, color: "#fff" }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deliverables */}
      <section style={{ paddingTop: 80, paddingBottom: 0 }}>
        <div style={{ paddingBottom: 40 }}>
          <p className="section-label">What you get</p>
        </div>
        <div className="del-grid">
          {[
            { num: "01", color: "#FF2D9B", title: "Full Logo Suite", body: "Primary mark, secondary variant, submark, and favicon. Horizontal, stacked, and icon formats. Every version you'll ever need." },
            { num: "02", color: "#1B4FFF", title: "Color System", body: "Hot pink, electric blue, and yellow — built as a proper system with usage rules, combinations, and what never to do." },
            { num: "03", color: "#FFE600", title: "Typography Stack", body: "Primary and secondary typefaces with hierarchy defined. Headlines, body, captions, apparel — all specified." },
            { num: "04", color: "#FF2D9B", title: "Brand Guidelines", body: "20–30 pages. The manual for The Solo Club identity. Logo usage, color rules, type hierarchy, voice, photography direction." },
            { num: "05", color: "#1B4FFF", title: "Social Media Starter Kit", body: "Profile assets, post templates, story formats. Ready to hand to a content creator without a single question." },
            { num: "06", color: "#FFE600", title: "Merch-Ready Files", body: "Business card design. One core marketing asset — hat mock, tee template, or launch graphic. Print-ready, supplier-ready." },
          ].map(({ num, color, title, body }) => (
            <div key={num} className="del-item">
              <div className="del-accent" style={{ background: color }} />
              <p className="del-num">{num}</p>
              <h3 className="del-title">{title}</h3>
              <p className="del-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={{ paddingTop: 80, paddingBottom: 0 }}>
        <div style={{ paddingBottom: 40 }}>
          <p className="section-label">The timeline</p>
        </div>
        <div className="timeline">
          {[
            { num: "1", week: "Week 1–2", phase: "Discovery & Direction", desc: "Brand audit, competitive analysis, 3 distinct logo directions presented with rationale." },
            { num: "2", week: "Week 3–4", phase: "Refinement", desc: "Chosen direction refined. Color system built. Typography selected. Logo suite completed." },
            { num: "3", week: "Week 5", phase: "System Build", desc: "Brand guidelines written. Social kit built. Merch templates designed." },
            { num: "4", week: "Week 6", phase: "Delivery", desc: "All source files organized and delivered. Full walkthrough call. You own everything." },
          ].map(({ num, week, phase, desc }) => (
            <div key={num} className="tl-step" data-num={num}>
              <p className="tl-week">{week}</p>
              <p className="tl-phase">{phase}</p>
              <p className="tl-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Investment summary */}
      <section style={{ padding: "80px 48px 0" }}>
        <div style={{ background: "#111", padding: "52px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#666", marginBottom: 12 }}>Total investment</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: "clamp(52px,8vw,96px)", color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>$3,500</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["50% deposit to start", "$1,750 due to begin"],
              ["50% at delivery", "$1,750 due before file transfer"],
              ["Timeline", "4–6 weeks from deposit"],
              ["Revisions", "2 rounds per deliverable"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", gap: 40, justifyContent: "space-between" }}>
                <p style={{ fontSize: 13, color: "#666" }}>{l}</p>
                <p style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-bg" />
        <h2 className="cta-headline">
          Let&apos;s build<br />
          <span>The Solo</span><br />
          Club.
        </h2>
        <p className="cta-sub">
          Schedule 30 minutes with Michael. We&apos;ll walk through this together, answer every question, and get you moving.
        </p>
        <div className="cta-buttons">
          <a href="https://calendly.com/woodfireddesigns/discovery" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Schedule a Call →
          </a>
          <a href="https://wfd-dashboard.vercel.app/quick" className="btn-secondary">
            Start the intake form
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-logo">Wood Fired Designs · Undrafted Designs LLC</span>
        <div className="footer-links">
          <a href="https://woodfireddesigns.com" target="_blank" rel="noopener noreferrer">woodfireddesigns.com</a>
          <a href="mailto:michael@woodfireddesigns.com">michael@woodfireddesigns.com</a>
        </div>
      </footer>

    </div>
  );
}
