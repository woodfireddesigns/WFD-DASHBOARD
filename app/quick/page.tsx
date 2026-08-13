"use client";
import { useState, useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;
    --font-d:'Oswald',sans-serif;--font-b:'DM Sans',sans-serif;
    --ease:cubic-bezier(0.16,1,0.3,1);
  }
  html,body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);-webkit-font-smoothing:antialiased;}
  h1,h2,h3{font-family:var(--font-d);text-transform:uppercase;letter-spacing:0.02em;line-height:1.05;}
  .q-enter{animation:qIn 0.35s var(--ease) both;}
  .q-enter-back{animation:qInBack 0.35s var(--ease) both;}
  @keyframes qIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
  @keyframes qInBack{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}
  .opt-card{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-radius:8px;border:1px solid var(--border);cursor:pointer;transition:border-color 0.18s,background 0.18s;}
  .opt-card:hover{border-color:var(--accent);background:var(--accent-dim);}
  .opt-card.sel{border-color:var(--accent);background:var(--accent-dim);}
  .opt-radio{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;transition:all 0.18s;}
  .opt-card.sel .opt-radio{border-color:var(--accent);background:var(--accent);}
  .opt-check{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all 0.18s;}
  .opt-card.sel .opt-check{border-color:var(--accent);background:var(--accent);}
  .field{width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:var(--font-b);font-size:14px;padding:11px 14px;outline:none;transition:border-color 0.2s;}
  .field:focus{border-color:var(--accent);}
  textarea.field{resize:vertical;min-height:80px;line-height:1.6;}
  .btn{padding:13px 28px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-family:var(--font-b);font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;}
  .btn:disabled{opacity:0.35;cursor:not-allowed;}
  .btn-ghost{padding:12px 20px;background:transparent;color:var(--text-secondary);border:1px solid var(--border);border-radius:7px;font-family:var(--font-b);font-size:13.5px;cursor:pointer;}
  .pkg-card{border:1px solid var(--border);border-radius:10px;padding:16px 18px;cursor:pointer;transition:border-color 0.2s,background 0.2s;margin-bottom:8px;}
  .pkg-card:hover,.pkg-card.sel{border-color:var(--accent);background:var(--accent-dim);}
`;

const PACKAGES = [
  { value: "spark_identity",  label: "Spark Identity",       price: 1200, turnaround: "2 weeks",  subtext: "Logo system, colors, typography, brand guide, launch assets." },
  { value: "ignite_brand",    label: "Ignite Brand System",  price: 3500, turnaround: "4–6 weeks", subtext: "Full logo suite, 20–30 page guidelines, social kit, business card, marketing asset." },
  { value: "forge_identity",  label: "Forge Complete Identity", price: 6500, turnaround: "6–8 weeks", subtext: "Everything in Ignite + social ad kit, email templates, landing page, stationery suite.", badge: "Premium" },
  { value: "packaging_single",label: "Packaging — Single SKU", price: 1200, turnaround: "10 days", subtext: "One product, print-ready, dieline from your printer." },
  { value: "packaging_system",label: "Packaging — Multi-SKU",  price: 2800, turnaround: "21 days", subtext: "3+ products, cohesive system across all SKUs." },
  { value: "photo_starter",   label: "AI Photography — Starter", price: 800, turnaround: "5 days", subtext: "10 images, 2 scene styles, white BG + lifestyle." },
  { value: "photo_pro",       label: "AI Photography — Pro",  price: 1500, turnaround: "7 days", subtext: "25 images, 4 scene styles, ecommerce + social ready.", badge: "Most Popular" },
  { value: "merch_single",    label: "Merch — Single Item",   price: 800,  turnaround: "7 days", subtext: "One apparel or product design, print-ready." },
  { value: "merch_line",      label: "Merch — Full Line",     price: 1800, turnaround: "14 days", subtext: "4+ items, cohesive collection, mockup presentation." },
];

const STYLE_OPTIONS = ["Clean & minimal","Bold & edgy","Warm & approachable","Dark & premium","Bright & energetic","Classic & professional","Luxury & refined","Playful & fun"];
const BASE_PRICES: Record<string, number> = Object.fromEntries(PACKAGES.map(p => [p.value, p.price]));

type Answers = Record<string, string | string[]>;
const STORAGE_KEY = "wfd_quick_progress";

export default function QuickIntakePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [dir, setDir] = useState<"fwd"|"back">("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (document.getElementById("quick-css")) return;
    const s = document.createElement("style"); s.id = "quick-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  // Resume progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); setAnswers(p.answers ?? {}); setStep(p.step ?? 0); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step }));
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1500);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
  }, [answers, step]);

  const pkg = PACKAGES.find(p => p.value === answers.package);
  const totalPts = BASE_PRICES[answers.package as string] ?? 0;

  const STEPS = [
    { id: "contact",    question: "Let's get started.",         sub: "Takes about 3 minutes. No obligations." },
    { id: "package",    question: "What do you need built?",    sub: "Pick your primary service." },
    { id: "style",      question: "What style direction feels right?", sub: "Pick up to 3." },
    { id: "brand_words",question: "Describe your brand in 3–5 words.", sub: "How you want people to feel." },
    { id: "timeline",   question: "When do you need this?",     sub: "" },
    { id: "notes",      question: "Anything else we should know?", sub: "Optional — skip if nothing comes to mind." },
  ];

  const q = STEPS[step];

  function canNext(): boolean {
    if (q.id === "contact") {
      const c = answers.contact as unknown as Record<string,string> ?? {};
      return !!(c.first_name?.trim() && c.email?.trim());
    }
    if (q.id === "package") return !!answers.package;
    if (q.id === "timeline") return !!answers.timeline;
    return true;
  }

  function next() {
    if (!canNext()) return;
    if (step >= STEPS.length - 1) { submit(); return; }
    setDir("fwd"); setStep(s => s + 1); setAnimKey(k => k + 1);
  }
  function back() {
    if (step === 0) return;
    setDir("back"); setStep(s => s - 1); setAnimKey(k => k + 1);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || done) return;
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (!canNext()) return;
      e.preventDefault(); next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  function setField(key: string, val: string) {
    setAnswers(p => {
      const c = (p.contact as unknown as Record<string,string>) ?? {};
      return { ...p, contact: { ...c, [key]: val } as unknown as string } as Answers;
    });
  }
  function toggleMulti(key: string, val: string) {
    const cur = (answers[key] as string[]) ?? [];
    setAnswers(p => ({ ...p, [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }));
  }

  async function submit() {
    setSubmitting(true);
    const contact = (answers.contact as unknown as Record<string,string>) ?? {};
    const payload = {
      form_type: "design",
      first_name: contact.first_name ?? "",
      last_name: contact.last_name ?? "",
      business_name: contact.business_name ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      package: answers.package ?? "",
      package_price: totalPts,
      style_direction: answers.style ?? [],
      brand_words: answers.brand_words ?? "",
      launch_timeline: answers.timeline ?? "",
      extra_notes: answers.notes ?? "",
      referral_source: "website",
      integrations: [],
      pages: [],
    };
    try {
      const res = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      localStorage.removeItem(STORAGE_KEY);
      setDone(true);
    } catch {
      setSubmitting(false);
    }
  }

  const animClass = dir === "fwd" ? "q-enter" : "q-enter-back";

  // ── Thank you screen ──
  if (done) {
    const contact = (answers.contact as unknown as Record<string,string>) ?? {};
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="q-enter" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🔥</div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 12 }}>
            Wood Fired Designs
          </p>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 34, color: "var(--text-primary)", marginBottom: 16 }}>
            You're in, {contact.first_name || "friend"}.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 12 }}>
            Your quote request has been received. Michael personally reviews every submission and will be in touch within <strong style={{ color: "var(--text-primary)" }}>24 hours</strong> — usually sooner.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 36 }}>
            If you want to jump ahead, you're welcome to schedule a quick call or wait to hear from us directly. Either way, we've got you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="https://calendly.com/woodfireddesigns/discovery" target="_blank" rel="noopener noreferrer"
              style={{ display: "block", padding: "14px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontFamily: "var(--font-b)", fontSize: 14, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              Schedule a Call →
            </a>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Or just sit tight — we'll reach out soon.</p>
          </div>
          <div style={{ marginTop: 40, padding: "18px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Your selected package</p>
            <p style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "var(--text-primary)" }}>{pkg?.label ?? answers.package as string}</p>
            {totalPts > 0 && <p style={{ fontSize: 13, color: "var(--accent)", marginTop: 4 }}>Starting at ${totalPts.toLocaleString()}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>Wood Fired Designs</p>
          <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden", maxWidth: 320, margin: "0 auto" }}>
            <div style={{ height: "100%", background: "var(--accent)", width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 0.35s var(--ease)" }} />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
            Step {step + 1} of {STEPS.length}
            <span style={{ marginLeft: 12, color: justSaved ? "var(--accent)" : "transparent", transition: "color 0.3s" }}>✓ Saved</span>
          </p>
        </div>

        {/* Question */}
        <div key={animKey} className={animClass}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 26, color: "var(--text-primary)", marginBottom: q.sub ? 8 : 24, textAlign: "center" }}>
            {q.question}
          </h2>
          {q.sub && <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 24, textAlign: "center" }}>{q.sub}</p>}

          {/* Contact */}
          {q.id === "contact" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ k: "first_name", l: "First Name *" }, { k: "last_name", l: "Last Name" }].map(({ k, l }) => (
                  <div key={k}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{l}</p>
                    <input className="field" value={((answers.contact as unknown as Record<string,string>) ?? {})[k] ?? ""}
                      onChange={e => setField(k, e.target.value)} placeholder="" />
                  </div>
                ))}
              </div>
              {[
                { k: "business_name", l: "Business Name", placeholder: "If applicable" },
                { k: "email", l: "Email Address *", placeholder: "" },
                { k: "phone", l: "Phone", placeholder: "Optional" },
              ].map(({ k, l, placeholder }) => (
                <div key={k}>
                  <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{l}</p>
                  <input className="field" type={k === "email" ? "email" : "text"} placeholder={placeholder}
                    value={((answers.contact as unknown as Record<string,string>) ?? {})[k] ?? ""}
                    onChange={e => setField(k, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* Package */}
          {q.id === "package" && (
            <div>
              {PACKAGES.map(p => (
                <div key={p.value} className={`pkg-card${answers.package === p.value ? " sel" : ""}`}
                  onClick={() => setAnswers(prev => ({ ...prev, package: p.value }))}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <p style={{ fontFamily: "var(--font-d)", fontSize: 14, color: "var(--text-primary)" }}>{p.label}</p>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {p.badge && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 7px", borderRadius: 99 }}>{p.badge}</span>}
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 99 }}>{p.turnaround}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.subtext}</p>
                </div>
              ))}
            </div>
          )}

          {/* Style */}
          {q.id === "style" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {STYLE_OPTIONS.map(s => {
                const sel = ((answers.style as string[]) ?? []).includes(s);
                return (
                  <div key={s} className={`opt-card${sel ? " sel" : ""}`} onClick={() => toggleMulti("style", s)}>
                    <div className="opt-check">
                      {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{s}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Brand words */}
          {q.id === "brand_words" && (
            <textarea className="field" placeholder="Bold. Premium. Approachable. Gritty. Whatever fits."
              value={(answers.brand_words as string) ?? ""}
              onChange={e => setAnswers(p => ({ ...p, brand_words: e.target.value }))} />
          )}

          {/* Timeline */}
          {q.id === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { v: "ASAP", label: "ASAP — let's move fast" },
                { v: "2-4 weeks", label: "Within 2–4 weeks" },
                { v: "1-2 months", label: "Within 1–2 months" },
                { v: "Flexible", label: "Flexible — no hard deadline" },
              ].map(({ v, label }) => (
                <div key={v} className={`opt-card${answers.timeline === v ? " sel" : ""}`}
                  onClick={() => setAnswers(p => ({ ...p, timeline: v }))}>
                  <div className="opt-radio" />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {q.id === "notes" && (
            <textarea className="field" placeholder="Skip if nothing comes to mind — we'll figure it out together."
              value={(answers.notes as string) ?? ""}
              onChange={e => setAnswers(p => ({ ...p, notes: e.target.value }))} />
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          {step > 0 && <button className="btn-ghost" onClick={back}>← Back</button>}
          <button className="btn" onClick={next} disabled={!canNext() || submitting}
            style={{ marginLeft: step > 0 ? 0 : "auto" }}>
            {submitting ? "Sending…" : step >= STEPS.length - 1 ? "Submit →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
