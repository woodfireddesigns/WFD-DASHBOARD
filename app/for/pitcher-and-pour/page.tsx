"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const PACKAGES: Record<string, { label: string; price: string; deliverables: string[]; timeline: string }> = {
  pp_brand_foundation: {
    label: "Brand Foundation",
    price: "$3,500",
    timeline: "3–4 weeks",
    deliverables: [
      "Wordmark + icon + medallion mark system",
      "Typography system",
      "Full color palette — HEX / CMYK / Pantone",
      "Brand guidelines PDF",
      "All source files",
    ],
  },
  pp_full_system: {
    label: "Full System",
    price: "$4,300",
    timeline: "5–6 weeks",
    deliverables: [
      "Everything in Brand Foundation",
      "Field Gear sub-brand identity",
      "Dual-channel co-existence rules",
      "Crate packaging structure guidance",
      "All source files",
    ],
  },
  pp_pitch_deck: {
    label: "Pitch Deck",
    price: "$1,500",
    timeline: "2 weeks",
    deliverables: [
      "15–20 slide Lowe's pitch deck",
      "Category argument for Lowe's buyer",
      "PDF export + editable source file",
    ],
  },
  pp_bundle: {
    label: "Full System + Pitch Deck Bundle",
    price: "$5,550",
    timeline: "6–8 weeks",
    deliverables: [
      "Everything in Full System (brand + Field Gear + packaging)",
      "Animated HTML pitch deck — interactive, motion-designed web presentation",
      "PDF version of the deck — for email, printing, and meetings",
      "Category argument + product hierarchy structured for a Lowe's buyer",
      "All source files — AI, EPS, SVG, PNG, editable deck — full ownership",
      "Save $250 vs buying separately",
    ],
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #F5F2EC; --bg-dark: #1A1713; --bg-dark-alt: #222018;
    --text: #1A1713; --text-muted: #6B6560; --text-inv: #F5F2EC; --text-inv-muted: #A09A93;
    --accent: #D4581A; --border: #DDD8CF; --border-dark: rgba(255,255,255,.08);
    --font-d: 'Anton', sans-serif; --font-b: 'Inter', sans-serif;
    --ease: cubic-bezier(.16,1,.3,1);
  }
  body { font-family: var(--font-b); background: var(--bg-dark); color: var(--text-inv); -webkit-font-smoothing: antialiased; min-height: 100vh; }
  input { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; color: var(--text-inv); font-family: var(--font-b); font-size: 15px; padding: 13px 16px; outline: none; transition: border-color .2s; }
  input::placeholder { color: var(--text-inv-muted); }
  input:focus { border-color: var(--accent); }
  .submit-btn { width: 100%; padding: 15px; background: linear-gradient(135deg,#E8632A,#D4581A,#B84010); color: #fff; border: none; border-radius: 8px; font-family: var(--font-b); font-size: 14px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; transition: filter .2s, transform .18s; }
  .submit-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
  .submit-btn:disabled { opacity: .45; cursor: not-allowed; }
  .del-item { display: flex; align-items: flex-start; gap: .6rem; font-size: .88rem; color: var(--text-inv-muted); line-height: 1.5; }
  .del-item::before { content: '→'; color: var(--accent); font-size: .72rem; flex-shrink: 0; margin-top: .15rem; }
`;

function PitcherAndPourForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pkg = searchParams.get("pkg") ?? "pp_full_system";
  const pkgInfo = PACKAGES[pkg] ?? PACKAGES.pp_full_system;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!document.getElementById("pp-start-css")) {
      const s = document.createElement("style"); s.id = "pp-start-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/direct-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), phone: phone.trim(), package: pkg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/onboard/${data.portalToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(245,242,236,.3)", textTransform: "uppercase", marginBottom: 48 }}>
          Wood Fired Designs
        </p>

        {/* Package badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,88,26,.14)", border: "1px solid rgba(212,88,26,.3)", borderRadius: 999, padding: "6px 14px", marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4581A", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E8632A" }}>
            {pkgInfo.label} · {pkgInfo.price}
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: "var(--font-d)", fontSize: "clamp(2.8rem,8vw,4.5rem)", lineHeight: .93, textTransform: "uppercase", color: "#F5F2EC", marginBottom: 16 }}>
          Let&apos;s build<br />Pitcher<br />&amp; Pour.
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-inv-muted)", lineHeight: 1.7, marginBottom: 36 }}>
          Drop your name and email below. We&apos;ll take you straight to the contract — no questionnaire, no back-and-forth.
        </p>

        {/* What's included */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "20px 20px", marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>What&apos;s included</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pkgInfo.deliverables.map((d, i) => (
              <div key={i} className="del-item">{d}</div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-inv-muted)" }}>
            ⏱ {pkgInfo.timeline} · {pkgInfo.price}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {error && <p style={{ fontSize: 13, color: "#E8632A" }}>{error}</p>}
          <button type="submit" className="submit-btn" disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}>
            {loading ? "Setting up your portal…" : "Continue to Contract →"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, color: "rgba(245,242,236,.2)", textAlign: "center", lineHeight: 1.6 }}>
          You&apos;ll review and sign a contract, then pay the 50% deposit to kick things off.
        </p>

      </div>
    </div>
  );
}

export default function PitcherAndPourPage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A1713" }}>
        <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Loading…</p>
      </div>
    }>
      <PitcherAndPourForm />
    </Suspense>
  );
}
