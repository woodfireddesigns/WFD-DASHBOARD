"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #100C09;
    --surface:    #181310;
    --card:       #201A14;
    --border:     #2C231A;
    --dim:        #3A3028;
    --text:       #EDE5D8;
    --muted:      #7A6F65;
    --gold:       #C09B52;
    --gold-dim:   rgba(192,155,82,0.10);
    --indigo:     #5B6EAA;
    --indigo-dim: rgba(91,110,170,0.10);
    --font-d: 'Cormorant Garamond', Georgia, serif;
    --font-b: 'Inter', sans-serif;
    --ease: cubic-bezier(0.16,1,0.3,1);
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-b); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

  /* ── Nav ── */
  .il-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 24px 52px; transition: all 0.4s; }
  .il-nav.scrolled { background: rgba(16,12,9,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
  .il-nav-logo { font-size: 10px; font-weight: 500; letter-spacing: 0.24em; color: var(--muted); text-transform: uppercase; }
  .il-nav-tag { font-size: 10px; font-weight: 500; letter-spacing: 0.18em; color: var(--gold); text-transform: uppercase; }

  /* ── Hero ── */
  .il-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 52px 88px; position: relative; overflow: hidden; }
  .il-hero-glow { position: absolute; inset: 0; background: radial-gradient(ellipse 55% 45% at 25% 65%, rgba(91,110,170,0.055) 0%, transparent 65%); pointer-events: none; }
  .il-hero-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase; color: var(--muted); margin-bottom: 30px; }
  .il-hero-title { font-family: var(--font-d); font-size: clamp(68px, 10.5vw, 152px); line-height: 0.88; font-weight: 300; font-style: italic; color: var(--text); }
  .il-hero-title strong { font-weight: 600; font-style: normal; }
  .il-hero-title em { color: var(--gold); }
  .il-hero-sub { font-size: 14px; font-weight: 300; color: var(--muted); margin-top: 32px; max-width: 500px; line-height: 1.85; }
  .il-hero-rule { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, var(--gold), rgba(91,110,170,0.35), transparent); }

  /* ── Sections ── */
  .il-section { padding: 96px 52px; }
  .il-label { font-size: 9px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold); margin-bottom: 48px; display: flex; align-items: center; gap: 18px; }
  .il-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* ── Read block ── */
  .il-read { background: var(--surface); border-left: 2px solid var(--gold); padding: 48px 52px; }
  .il-read-quote { font-family: var(--font-d); font-size: clamp(26px, 3.8vw, 46px); font-weight: 300; font-style: italic; color: var(--text); line-height: 1.28; max-width: 820px; }
  .il-read-quote strong { font-weight: 600; font-style: normal; color: var(--gold); }
  .il-read-body { font-size: 14px; color: var(--muted); line-height: 1.9; font-weight: 300; max-width: 620px; margin-top: 28px; }

  /* ── Scope grid ── */
  .il-scope { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); }
  .il-scope-item { background: var(--surface); padding: 40px 34px; position: relative; }
  .il-scope-item::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .il-scope-item.g::before { background: var(--gold); }
  .il-scope-item.i::before { background: var(--indigo); }
  .il-scope-item.d::before { background: var(--dim); }
  .il-scope-num { font-family: var(--font-d); font-size: 11px; font-weight: 300; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 22px; }
  .il-scope-title { font-family: var(--font-d); font-size: clamp(20px, 2.2vw, 28px); font-weight: 600; color: var(--text); line-height: 1.1; margin-bottom: 12px; }
  .il-scope-body { font-size: 12.5px; color: var(--muted); line-height: 1.8; font-weight: 300; }
  .il-scope-bullets { margin-top: 18px; display: flex; flex-direction: column; gap: 7px; }
  .il-bullet { font-size: 11.5px; color: #5A5048; line-height: 1.6; font-weight: 300; padding-left: 16px; position: relative; }
  .il-bullet::before { content: '—'; position: absolute; left: 0; color: var(--gold); font-size: 9px; top: 2px; }

  /* ── Investment ── */
  .il-inv { background: var(--surface); border: 1px solid var(--border); padding: 56px 52px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 40px; }
  .il-inv-price { font-family: var(--font-d); font-size: clamp(72px, 10vw, 120px); font-weight: 300; color: var(--text); line-height: 1; letter-spacing: -0.01em; }
  .il-inv-price em { color: var(--gold); font-style: italic; }
  .il-inv-rows { display: flex; flex-direction: column; gap: 14px; min-width: 320px; }
  .il-inv-row { display: flex; justify-content: space-between; gap: 40px; align-items: baseline; }
  .il-inv-label { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }
  .il-inv-val { font-size: 13px; font-weight: 500; color: var(--text); }
  .il-inv-div { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── Timeline ── */
  .il-tl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); }
  .il-tl-item { background: var(--surface); padding: 34px 28px; }
  .il-tl-week { font-size: 9px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  .il-tl-phase { font-family: var(--font-d); font-size: 19px; font-weight: 600; color: var(--text); margin-bottom: 10px; line-height: 1.2; }
  .il-tl-desc { font-size: 12px; color: var(--muted); line-height: 1.72; font-weight: 300; }

  /* ── Not included ── */
  .il-excl { background: var(--surface); border: 1px solid var(--border); padding: 26px 36px; display: flex; gap: 40px; align-items: flex-start; flex-wrap: wrap; }
  .il-excl-label { font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); flex-shrink: 0; padding-top: 2px; }
  .il-excl-items { display: flex; flex-wrap: wrap; gap: 8px 32px; }
  .il-excl-item { font-size: 12px; color: var(--muted); font-weight: 300; line-height: 1.6; }

  /* ── CTA / Form ── */
  .il-cta { padding: 100px 52px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .il-cta-hed { font-family: var(--font-d); font-size: clamp(48px, 7vw, 90px); font-weight: 300; font-style: italic; line-height: 0.93; color: var(--text); }
  .il-cta-hed em { color: var(--gold); }
  .il-cta-sub { font-size: 13px; color: var(--muted); line-height: 1.85; font-weight: 300; margin-top: 24px; max-width: 380px; }
  .il-form { background: var(--surface); border: 1px solid var(--border); padding: 40px; }
  .il-form-label { font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); margin-bottom: 22px; display: block; }
  .il-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .il-input { width: 100%; background: var(--card); border: 1px solid var(--dim); color: var(--text); font-family: var(--font-b); font-size: 13px; font-weight: 300; padding: 13px 16px; outline: none; transition: border-color 0.2s; display: block; }
  .il-input::placeholder { color: var(--dim); }
  .il-input:focus { border-color: var(--gold); }
  .il-btn { width: 100%; margin-top: 12px; padding: 16px; background: var(--gold); color: #100C09; font-family: var(--font-b); font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.18s; }
  .il-btn:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
  .il-btn:disabled { opacity: 0.28; cursor: not-allowed; transform: none; }
  .il-form-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 14px; line-height: 1.6; font-weight: 300; }

  /* ── Footer ── */
  .il-footer { padding: 30px 52px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .il-footer-copy { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }
  .il-footer-links { display: flex; gap: 26px; }
  .il-footer-links a { font-size: 11px; color: var(--muted); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
  .il-footer-links a:hover { color: var(--text); }

  /* ── Animations ── */
  .il-fade { animation: ilFade 1s var(--ease) both; }
  .il-fade-2 { animation: ilFade 1s var(--ease) 0.1s both; }
  .il-fade-3 { animation: ilFade 1s var(--ease) 0.22s both; }
  @keyframes ilFade { from { opacity:0; transform: translateY(22px); } to { opacity:1; transform:none; } }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .il-nav { padding: 20px 24px; }
    .il-hero { padding: 0 24px 72px; }
    .il-section { padding: 72px 24px; }
    .il-read { padding: 36px 28px; }
    .il-scope { grid-template-columns: 1fr; }
    .il-scope-item.span2 { grid-column: span 1; }
    .il-inv { padding: 40px 28px; flex-direction: column; align-items: flex-start; }
    .il-inv-rows { min-width: unset; width: 100%; }
    .il-tl { grid-template-columns: 1fr 1fr; }
    .il-cta { grid-template-columns: 1fr; gap: 48px; padding: 72px 24px; }
    .il-footer { flex-direction: column; gap: 14px; text-align: center; padding: 26px 24px; }
    .il-footer-links { flex-wrap: wrap; justify-content: center; }
  }
`;

export default function IndigoLeatherProposal() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [firstName, setFirstName] = useState("Crystal");
  const [lastName, setLastName] = useState("Deschenes");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!document.getElementById("il-css")) {
      const s = document.createElement("style");
      s.id = "il-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !email.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/direct-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          package: "il_full_launch",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/onboard/${data.portalToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  const isValid = firstName.trim() && email.trim() && phone.trim();

  return (
    <div style={{ background: "#100C09", minHeight: "100vh" }}>

      {/* Nav */}
      <nav className={`il-nav${scrolled ? " scrolled" : ""}`}>
        <span className="il-nav-logo">Wood Fired Designs</span>
        <span className="il-nav-tag">Prepared for Crystal Deschenes · June 2026</span>
      </nav>

      {/* Hero */}
      <div className="il-hero">
        <div className="il-hero-glow" />
        <p className="il-hero-eyebrow il-fade">Indigo Leather · Brand &amp; Commerce Launch Proposal</p>
        <h1 className="il-hero-title il-fade-2">
          Handmade.<br />
          <strong>Professionally</strong><br />
          <em>Sold.</em>
        </h1>
        <p className="il-hero-sub il-fade-3">
          A complete launch package — AI-directed product photography, brand copy, and a headless Zoho Commerce storefront built to sell premium leather goods. One flat rate. Three to four weeks. Done right.
        </p>
        <div className="il-hero-rule" />
      </div>

      {/* What we see */}
      <section className="il-section" style={{ paddingBottom: 0 }}>
        <p className="il-label">What we see in Indigo Leather</p>
        <div className="il-read">
          <p className="il-read-quote">
            Your bags are <strong>the real thing</strong> — handmade, full-grain, built with craft that most brands only reference in their copy. You don&apos;t have a product problem. You have a <strong>presentation problem</strong>.
          </p>
          <p className="il-read-body">
            The images you shoot on your phone don&apos;t match what you make. The copy doesn&apos;t say what the leather says when someone holds it. And right now there&apos;s no store that does your work justice. This package fixes all three — in three to four weeks, at a price that makes sense for where you are right now.
          </p>
        </div>
      </section>

      {/* Scope */}
      <section className="il-section" style={{ paddingBottom: 0 }}>
        <p className="il-label">What&apos;s included</p>
        <div className="il-scope">

          <div className="il-scope-item g">
            <p className="il-scope-num">01</p>
            <h3 className="il-scope-title">Product Photography</h3>
            <p className="il-scope-body">AI-directed studio and lifestyle images built around your brand&apos;s tone — not generic, not stock.</p>
            <div className="il-scope-bullets">
              <p className="il-bullet">Hero shots — 3/4 angle, catalog-ready</p>
              <p className="il-bullet">Flatlay arrangements with props</p>
              <p className="il-bullet">Detail and leather texture closeups</p>
              <p className="il-bullet">Lifestyle shots — domestic and urban</p>
              <p className="il-bullet">High-res files, web and print ready</p>
              <p className="il-bullet">Art direction tailored to your target customer</p>
            </div>
          </div>

          <div className="il-scope-item i">
            <p className="il-scope-num">02</p>
            <h3 className="il-scope-title">Brand Copy</h3>
            <p className="il-scope-body">Words that sell without feeling like they&apos;re selling — written for the customer who already knows quality but needs to feel it.</p>
            <div className="il-scope-bullets">
              <p className="il-bullet">Tagline and brand voice guide</p>
              <p className="il-bullet">Product descriptions written for conversion</p>
              <p className="il-bullet">Homepage, About, and key page copy</p>
              <p className="il-bullet">SEO-considerate headlines and metadata</p>
            </div>
          </div>

          <div className="il-scope-item g">
            <p className="il-scope-num">03</p>
            <h3 className="il-scope-title">Headless Zoho Store</h3>
            <p className="il-scope-body">A complete commerce setup — not a template. A real storefront configured for premium product presentation.</p>
            <div className="il-scope-bullets">
              <p className="il-bullet">Zoho Commerce account setup and configuration</p>
              <p className="il-bullet">Product catalog with images and copy integrated</p>
              <p className="il-bullet">Payment gateway and checkout configured</p>
              <p className="il-bullet">Custom domain setup and SSL</p>
              <p className="il-bullet">Headless front-end connected via Zoho API</p>
            </div>
          </div>

          <div className="il-scope-item d">
            <p className="il-scope-num">04</p>
            <h3 className="il-scope-title">Site Design</h3>
            <p className="il-scope-body">Every page built for premium brand perception — minimal, fast, and conversion-focused.</p>
            <div className="il-scope-bullets">
              <p className="il-bullet">Custom homepage design</p>
              <p className="il-bullet">Collection and product page templates</p>
              <p className="il-bullet">Navigation architecture</p>
              <p className="il-bullet">Mobile-responsive across all devices</p>
              <p className="il-bullet">Performance-optimized page load</p>
            </div>
          </div>

          <div className="il-scope-item i span2" style={{ gridColumn: "span 2" }}>
            <p className="il-scope-num">05</p>
            <h3 className="il-scope-title">Launch &amp; Handoff</h3>
            <p className="il-scope-body">You leave this knowing how to run your store. Pre-launch QA, a 30-minute walkthrough, and documentation for adding new products — so you&apos;re not dependent on us the moment we hand over the keys.</p>
            <div className="il-scope-bullets" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 36px" }}>
              <p className="il-bullet">Pre-launch QA across browsers and devices</p>
              <p className="il-bullet">30-minute owner walkthrough</p>
              <p className="il-bullet">Documentation for adding and updating products</p>
              <p className="il-bullet">Everything transferred — you own it all</p>
            </div>
          </div>

        </div>
      </section>

      {/* Investment */}
      <section className="il-section" style={{ paddingBottom: 0 }}>
        <p className="il-label">Investment</p>
        <div className="il-inv">
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Total — flat rate</p>
            <p className="il-inv-price">$2,<em>400</em></p>
          </div>
          <div className="il-inv-rows">
            <div className="il-inv-row">
              <span className="il-inv-label">Covers</span>
              <span className="il-inv-val">Photography · Copy · Store · Design · Launch</span>
            </div>
            <div className="il-inv-div" />
            <div className="il-inv-row">
              <span className="il-inv-label">Deposit to start (50%)</span>
              <span className="il-inv-val">$1,200</span>
            </div>
            <div className="il-inv-row">
              <span className="il-inv-label">Balance at delivery (50%)</span>
              <span className="il-inv-val">$1,200</span>
            </div>
            <div className="il-inv-div" />
            <div className="il-inv-row">
              <span className="il-inv-label">Timeline</span>
              <span className="il-inv-val">3–4 weeks from deposit</span>
            </div>
            <div className="il-inv-row">
              <span className="il-inv-label">No hourly surprises</span>
              <span className="il-inv-val">Flat rate, start to finish</span>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="il-section" style={{ paddingBottom: 0 }}>
        <p className="il-label">The timeline</p>
        <div className="il-tl">
          {[
            { week: "Week 1", phase: "Photography & Copy", desc: "Art direction brief, AI image generation, first draft of all copy. Images and words delivered together — ready to build on." },
            { week: "Week 1–2", phase: "Store Setup", desc: "Zoho Commerce configured, payment gateway live, domain connected, product catalog structured." },
            { week: "Week 2–3", phase: "Design & Build", desc: "Homepage, collection, and product pages built on the headless front-end with your photography and copy fully integrated." },
            { week: "Week 3–4", phase: "QA & Launch", desc: "Full cross-browser and device QA, walkthrough call, final handoff. You go live." },
          ].map(({ week, phase, desc }) => (
            <div key={phase} className="il-tl-item">
              <p className="il-tl-week">{week}</p>
              <p className="il-tl-phase">{phase}</p>
              <p className="il-tl-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Not included */}
      <section className="il-section" style={{ paddingTop: 40, paddingBottom: 0 }}>
        <div className="il-excl">
          <p className="il-excl-label">Not included</p>
          <div className="il-excl-items">
            {[
              "Ongoing monthly maintenance (available separately)",
              "Paid ad setup or social media management",
              "On-location physical photography",
              "Zoho Commerce subscription fees (billed by Zoho)",
            ].map((item) => (
              <p key={item} className="il-excl-item">{item}</p>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Form */}
      <div className="il-cta">
        <div>
          <h2 className="il-cta-hed">
            Let&apos;s build<br />
            Indigo<br />
            <em>Leather.</em>
          </h2>
          <p className="il-cta-sub">
            Drop your info below. We&apos;ll take you straight to the contract — no back-and-forth. The $1,200 deposit kicks things off.
          </p>
        </div>

        <div className="il-form">
          <span className="il-form-label">Your details</span>
          <form onSubmit={handleSubmit}>
            <div className="il-form-row">
              <input
                className="il-input"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                className="il-input"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              className="il-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginBottom: 8 }}
            />
            <input
              className="il-input"
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {error && <p style={{ fontSize: 12, color: "#C05A3A", marginTop: 10 }}>{error}</p>}
            <button className="il-btn" type="submit" disabled={!isValid || loading}>
              {loading ? "Setting up your portal…" : "Continue to Contract →"}
            </button>
          </form>
          <p className="il-form-note">
            You&apos;ll review and sign a contract, then pay the $1,200 deposit to begin.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="il-footer">
        <span className="il-footer-copy">Wood Fired Designs · Undrafted Designs LLC</span>
        <div className="il-footer-links">
          <a href="https://woodfireddesigns.com" target="_blank" rel="noopener noreferrer">woodfireddesigns.com</a>
          <a href="mailto:michael@woodfireddesigns.com">michael@woodfireddesigns.com</a>
        </div>
      </footer>

    </div>
  );
}
