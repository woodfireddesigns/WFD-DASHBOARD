"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #100C09;
    --surface: #181310;
    --card:    #201A14;
    --border:  #2C231A;
    --dim:     #3A3028;
    --text:    #EDE5D8;
    --muted:   #7A6F65;
    --gold:    #C09B52;
    --font-d: 'Cormorant Garamond', Georgia, serif;
    --font-b: 'Inter', sans-serif;
    --ease: cubic-bezier(0.16,1,0.3,1);
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-b); -webkit-font-smoothing: antialiased; }

  .ilq-wrap { max-width: 700px; margin: 0 auto; padding: 72px 32px 96px; }

  .ilq-header { margin-bottom: 64px; }
  .ilq-eyebrow { font-size: 9px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .ilq-title { font-family: var(--font-d); font-size: clamp(38px, 6vw, 64px); font-weight: 300; font-style: italic; line-height: 1.05; color: var(--text); margin-bottom: 20px; }
  .ilq-title em { color: var(--gold); }
  .ilq-sub { font-size: 14px; color: var(--muted); line-height: 1.85; font-weight: 300; max-width: 520px; }

  .ilq-rule { height: 1px; background: var(--border); margin: 48px 0; }

  .ilq-field { margin-bottom: 40px; }
  .ilq-label { font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; display: block; }
  .ilq-hint { font-size: 12px; color: var(--muted); line-height: 1.7; font-weight: 300; margin-bottom: 12px; }
  .ilq-input { width: 100%; background: var(--card); border: 1px solid var(--dim); color: var(--text); font-family: var(--font-b); font-size: 14px; font-weight: 300; padding: 14px 18px; outline: none; transition: border-color 0.2s; display: block; line-height: 1.6; }
  .ilq-input::placeholder { color: var(--dim); }
  .ilq-input:focus { border-color: var(--gold); }
  textarea.ilq-input { resize: vertical; min-height: 100px; }
  textarea.ilq-input.tall { min-height: 140px; }
  .ilq-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .ilq-section-head { font-family: var(--font-d); font-size: 24px; font-weight: 600; color: var(--text); margin-bottom: 32px; }

  .ilq-btn { display: block; width: 100%; padding: 18px; background: var(--gold); color: #100C09; font-family: var(--font-b); font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.18s; margin-top: 48px; }
  .ilq-btn:hover:not(:disabled) { opacity: 0.84; transform: translateY(-1px); }
  .ilq-btn:disabled { opacity: 0.28; cursor: not-allowed; transform: none; }

  .ilq-footer { padding: 24px 0; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; margin-top: 64px; flex-wrap: wrap; gap: 12px; }
  .ilq-footer-copy { font-size: 11px; color: var(--muted); }
  .ilq-footer-links { display: flex; gap: 20px; }
  .ilq-footer-links a { font-size: 11px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .ilq-footer-links a:hover { color: var(--text); }

  @media (max-width: 600px) {
    .ilq-wrap { padding: 56px 20px 72px; }
    .ilq-row { grid-template-columns: 1fr; }
    .ilq-footer { flex-direction: column; text-align: center; }
    .ilq-footer-links { justify-content: center; }
  }
`;

const QUESTIONS = [
  {
    section: "Your Story",
    fields: [
      {
        id: "origin",
        label: "How did Indigo Leather start?",
        hint: "The origin story — what made you start making leather goods? Was there a moment, a gap in the market, a personal need?",
        placeholder: "Tell us the story…",
        tall: true,
      },
      {
        id: "craft",
        label: "Describe your process and craft.",
        hint: "What does making a bag actually look like? What materials do you use? What decisions go into each piece?",
        placeholder: "Walk us through how you make something…",
        tall: true,
      },
      {
        id: "proudest",
        label: "What piece are you most proud of, and why?",
        hint: "Could be one you made, one a customer loved, or one that felt like a breakthrough.",
        placeholder: "Describe it…",
        tall: false,
      },
    ],
  },
  {
    section: "Your Business",
    fields: [
      {
        id: "products",
        label: "What do you currently make and sell?",
        hint: "Walk us through your lineup — bag types, sizes, materials, colorways, price points.",
        placeholder: "List your products and any key details…",
        tall: true,
      },
      {
        id: "differentiator",
        label: "What makes Indigo Leather different from other leather goods?",
        hint: "Not the marketing answer — the honest one. What do you do that most don't?",
        placeholder: "Be specific…",
        tall: false,
      },
      {
        id: "selling_now",
        label: "Where are you selling right now?",
        hint: "Etsy, Instagram, farmers markets, word of mouth, existing website — wherever it is.",
        placeholder: "Current sales channels…",
        tall: false,
      },
      {
        id: "price_position",
        label: "How does your pricing position you in the market?",
        hint: "Are you accessible, mid-range, premium, or luxury? How do your prices compare to comparable products?",
        placeholder: "Your price point and what it communicates…",
        tall: false,
      },
    ],
  },
  {
    section: "Your Customer",
    fields: [
      {
        id: "ideal_customer",
        label: "Describe your ideal customer in detail.",
        hint: "Age, lifestyle, values, how they shop, what they already own, what they care about when buying a bag.",
        placeholder: "Paint a picture of the person you're making this for…",
        tall: true,
      },
      {
        id: "customer_feedback",
        label: "What do customers say when they love your work?",
        hint: "Direct quotes, reviews, messages — what words do they actually use?",
        placeholder: "What people say when they're blown away by the product…",
        tall: false,
      },
    ],
  },
  {
    section: "Your Brand",
    fields: [
      {
        id: "brand_personality",
        label: "If Indigo Leather were a person, how would you describe them?",
        hint: "Age, vibe, how they dress, how they talk, what they'd never say or do. Be specific — this becomes the voice and tone guide.",
        placeholder: "Describe the Indigo Leather persona…",
        tall: true,
      },
      {
        id: "brand_words",
        label: "Five words that must be true about this brand.",
        hint: "Not aspirational — honest. Words that already describe what you make and how you do it.",
        placeholder: "e.g. Honest. Earned. Warm. Handmade. Quiet.",
        tall: false,
      },
      {
        id: "inspiration",
        label: "Brands you admire — inside or outside leather goods.",
        hint: "What draws you to them? It can be the aesthetic, the storytelling, the photography, the copy, or all of it.",
        placeholder: "Name brands and say what you love about them…",
        tall: false,
      },
      {
        id: "avoid",
        label: "Aesthetics or brands you definitely don't want to look like.",
        hint: "Nothing is off-limits here — this is just as useful as what you want.",
        placeholder: "What feels completely wrong for Indigo Leather…",
        tall: false,
      },
    ],
  },
  {
    section: "Goals & Vision",
    fields: [
      {
        id: "goal_12mo",
        label: "What's your #1 goal for Indigo Leather in the next 12 months?",
        hint: "Revenue target, number of units, audience size, getting into a retailer — whatever it actually is.",
        placeholder: "Be specific and honest…",
        tall: false,
      },
      {
        id: "long_term",
        label: "Where do you see Indigo Leather in five years?",
        hint: "Don't filter this — we want to understand the ambition behind the brand, not just the next step.",
        placeholder: "The bigger picture…",
        tall: false,
      },
      {
        id: "extra",
        label: "Anything else we should know?",
        hint: "Hard constraints, things you've already tried, things you're worried about, context that would help us do this right.",
        placeholder: "Open field — put anything here…",
        tall: false,
      },
    ],
  },
];

type Answers = Record<string, string>;

export default function IndigoLeatherQuestionnaire() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({
    firstName: "Crystal",
    lastName: "Deschenes",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!document.getElementById("ilq-css")) {
      const s = document.createElement("style");
      s.id = "ilq-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  function set(id: string, val: string) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answers.email?.trim() || !answers.phone?.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/il-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
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
    <div style={{ background: "#100C09", minHeight: "100vh" }}>
      <form className="ilq-wrap" onSubmit={handleSubmit}>

        {/* Header */}
        <div className="ilq-header">
          <p className="ilq-eyebrow">Indigo Leather · Discovery Questionnaire</p>
          <h1 className="ilq-title">
            Tell us<br />your <em>story.</em>
          </h1>
          <p className="ilq-sub">
            Before we touch a single image or write a single word, we need to understand Indigo Leather — not the elevator pitch, the real one. Take your time. The more you give us here, the better everything will be.
          </p>
        </div>

        {/* Contact */}
        <div className="ilq-row" style={{ marginBottom: 10 }}>
          <div>
            <label className="ilq-label">First name</label>
            <input
              className="ilq-input"
              type="text"
              value={answers.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="First name"
              required
            />
          </div>
          <div>
            <label className="ilq-label">Last name</label>
            <input
              className="ilq-input"
              type="text"
              value={answers.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>
        <div className="ilq-row" style={{ marginBottom: 0 }}>
          <div className="ilq-field" style={{ marginBottom: 0 }}>
            <label className="ilq-label">Email</label>
            <input
              className="ilq-input"
              type="email"
              value={answers.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="Email address"
              required
            />
          </div>
          <div className="ilq-field" style={{ marginBottom: 0 }}>
            <label className="ilq-label">Phone</label>
            <input
              className="ilq-input"
              type="tel"
              value={answers.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Phone number"
              required
            />
          </div>
        </div>

        {/* Questions by section */}
        {QUESTIONS.map((section) => (
          <div key={section.section}>
            <div className="ilq-rule" />
            <p className="ilq-section-head">{section.section}</p>
            {section.fields.map((field) => (
              <div key={field.id} className="ilq-field">
                <label className="ilq-label">{field.label}</label>
                {field.hint && <p className="ilq-hint">{field.hint}</p>}
                <textarea
                  className={`ilq-input${field.tall ? " tall" : ""}`}
                  value={answers[field.id] ?? ""}
                  onChange={(e) => set(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        ))}

        {error && <p style={{ fontSize: 12, color: "#C05A3A", marginTop: 16 }}>{error}</p>}

        <button
          className="ilq-btn"
          type="submit"
          disabled={loading || !answers.email?.trim() || !answers.phone?.trim()}
        >
          {loading ? "Setting up your portal…" : "Continue to Contract →"}
        </button>

        <footer className="ilq-footer">
          <span className="ilq-footer-copy">Wood Fired Designs · Undrafted Designs LLC</span>
          <div className="ilq-footer-links">
            <a href="https://woodfireddesigns.com" target="_blank" rel="noopener noreferrer">woodfireddesigns.com</a>
            <a href="mailto:michael@woodfireddesigns.com">michael@woodfireddesigns.com</a>
          </div>
        </footer>

      </form>
    </div>
  );
}
