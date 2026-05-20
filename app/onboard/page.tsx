"use client";
import { useState, useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;--text-muted:#5A5248;
    --font-d:'Anton',sans-serif;--font-b:'DM Sans',sans-serif;
    --ease:cubic-bezier(0.16,1,0.3,1);
  }
  body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);}
  .q-enter{animation:qIn 0.35s var(--ease) both;}
  .q-enter-back{animation:qInBack 0.35s var(--ease) both;}
  @keyframes qIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
  @keyframes qInBack{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
  .opt-card{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-radius:8px;border:1px solid var(--border);cursor:pointer;transition:border-color 0.18s,background 0.18s;}
  .opt-card:hover{border-color:var(--accent);background:var(--accent-dim);}
  .opt-card.selected{border-color:var(--accent);background:var(--accent-dim);}
  .opt-radio{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;transition:border-color 0.18s,background 0.18s;}
  .opt-card.selected .opt-radio{border-color:var(--accent);background:var(--accent);}
  .opt-check{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:border-color 0.18s,background 0.18s;}
  .opt-card.selected .opt-check{border-color:var(--accent);background:var(--accent);}
  .field-input{width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:var(--font-b);font-size:14px;padding:11px 14px;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:var(--accent);}
  textarea.field-input{resize:vertical;min-height:90px;line-height:1.6;}
  .btn-primary{padding:12px 28px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-family:var(--font-b);font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.04em;transition:opacity 0.2s;}
  .btn-primary:disabled{opacity:0.35;cursor:not-allowed;}
  .btn-ghost{padding:12px 20px;background:transparent;color:var(--text-secondary);border:1px solid var(--border);border-radius:7px;font-family:var(--font-b);font-size:13.5px;cursor:pointer;transition:color 0.18s,border-color 0.18s;}
  .btn-ghost:hover{color:var(--text-primary);border-color:var(--text-muted);}
  .scope-item{animation:scopeIn 0.3s var(--ease) both;}
  @keyframes scopeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .pkg-card{border:1px solid var(--border);border-radius:10px;padding:18px 20px;cursor:pointer;transition:border-color 0.2s,background 0.2s;}
  .pkg-card:hover{border-color:var(--accent);background:var(--accent-dim);}
  .pkg-card.selected{border-color:var(--accent);background:var(--accent-dim);}
  /* ── Mobile ── */
  .layout-wrap{display:flex;height:100vh;}
  .q-panel{flex:0 0 58%;display:flex;flex-direction:column;border-right:1px solid var(--border);background:var(--bg-surface);overflow-y:auto;}
  .scope-panel{flex:1;overflow-y:auto;}
  .scope-inner{max-width:560px;margin:0 auto;padding:48px 36px;height:100%;display:flex;flex-direction:column;}
  h1,h2,h3,[style*="var(--font-d)"]{text-transform:uppercase;letter-spacing:0.02em;}
  @media(max-width:768px){
    .layout-wrap{flex-direction:column;height:auto;min-height:100vh;}
    .q-panel{flex:none;width:100%;border-right:none;border-bottom:1px solid var(--border);}
    .scope-panel{display:none;}
    .q-inner{padding:32px 20px!important;max-width:100%!important;}
    .q-headline{font-size:22px!important;}
    .controls-bar{padding-top:20px!important;margin-top:24px!important;}
  }
`;

const PACKAGES = [
  {
    value: "starter_site",
    label: "Starter Site",
    subtext: "A single powerful page. Fast, mobile-optimized, Google-ready.",
    turnaround: "5 business days",
    includes: ["Single-page website", "Mobile-optimized", "Contact form + click-to-call", "Google-ready setup", "You own everything"],
  },
  {
    value: "full_website",
    label: "Full Website",
    subtext: "Up to 5 pages, built to rank and convert.",
    turnaround: "7 business days",
    badge: "Most Popular",
    includes: ["Up to 5 pages", "SEO foundation", "Lead capture", "Services & portfolio pages", "GA + Search Console", "You own everything"],
  },
  {
    value: "brand_and_site",
    label: "Brand + Site",
    subtext: "Logo, brand identity, and full website — built together from scratch.",
    turnaround: "14 business days",
    badge: "Best Value",
    includes: ["Everything in Full Website", "Logo & brand identity", "Color & typography system", "Brand guidelines doc", "Vehicle wrap / signage files"],
  },
];

const PAGES_OPTIONS = ["Home", "About", "Services", "Portfolio / Work", "Contact", "Blog", "FAQ", "Booking / Scheduling", "Team", "Testimonials"];
const INTEGRATION_OPTIONS = ["Online booking system", "Email capture / newsletter", "Online store", "Social media feeds", "Google Analytics", "Chat widget", "Payment processing", "None needed"];
const STYLE_OPTIONS = ["Clean & minimal", "Bold & edgy", "Warm & approachable", "Dark & premium", "Bright & energetic", "Classic & professional", "Modern & techy", "Rustic & handcrafted"];

interface Answers { [key: string]: string | string[] | boolean }

const SCOPE_LABELS: Record<string, string> = {
  starter_site: "Starter Site",
  full_website: "Full Website",
  brand_and_site: "Brand + Site",
};

function ScopePanel({ answers }: { answers: Answers }) {
  const pkg = answers.package as string;
  const pages = (answers.pages as string[]) ?? [];
  const integrations = ((answers.integrations as string[]) ?? []).filter((i) => i !== "None needed");
  const style = (answers.style_direction as string[]) ?? [];
  const goal = answers.primary_goal as string;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "48px 36px", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 20 }}>
        Your Project Scope
      </p>

      {answers.first_name ? (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
            {answers.first_name}{answers.last_name ? ` ${answers.last_name}` : ""}
          </h2>
          {answers.business_name && <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{answers.business_name as string}</p>}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: "var(--text-muted)" }}>Your scope builds here</h2>
        </div>
      )}

      <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

      {!pkg && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8 }}>Answer the questions on the left and your project scope will populate here in real time.</p>
      )}

      {pkg && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Package */}
          <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{SCOPE_LABELS[pkg]}</p>
              <span style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99, fontWeight: 500 }}>
                {PACKAGES.find((p) => p.value === pkg)?.turnaround}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(PACKAGES.find((p) => p.value === pkg)?.includes ?? []).map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Goal */}
          {goal && (
            <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 5 }}>Primary Goal</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{goal}</p>
            </div>
          )}

          {/* Pages */}
          {pages.length > 0 && (
            <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Pages</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {pages.map((p) => (
                  <span key={p} style={{ fontSize: 11.5, color: "var(--text-primary)", background: "var(--bg)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 99 }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Style */}
          {style.length > 0 && (
            <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Style Direction</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {style.map((s) => (
                  <span key={s} style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--accent-dim)", padding: "3px 10px", borderRadius: 99 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Integrations */}
          {integrations.length > 0 && (
            <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Integrations</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {integrations.map((i) => (
                  <div key={i} style={{ display: "flex", gap: 7 }}>
                    <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 2 }}>✦</span>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{i}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {answers.launch_timeline && (
            <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 5 }}>Launch Timeline</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{answers.launch_timeline as string}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type QuestionType = "text_fields" | "textarea" | "single_select" | "multi_select" | "package_select" | "info";

interface Field { key: string; label: string; required?: boolean; placeholder?: string }
interface Option { value: string; label: string; subtext?: string; badge?: string }
interface Question {
  id: string;
  type: QuestionType;
  question: string;
  subtext?: string;
  fields?: Field[];
  options?: Option[];
  items?: string[];
  required?: boolean;
  showIf?: (answers: Answers) => boolean;
}

const QUESTIONS: Question[] = [
  {
    id: "contact",
    type: "text_fields",
    question: "Let's start with the basics.",
    subtext: "This takes about 5 minutes. The more detail you give, the faster we can move.",
    fields: [
      { key: "first_name", label: "First Name", required: true },
      { key: "last_name", label: "Last Name", required: true },
      { key: "business_name", label: "Business Name", placeholder: "If you have one" },
      { key: "email", label: "Email Address", required: true },
      { key: "phone", label: "Phone Number" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
    ],
  },
  {
    id: "referral_source",
    type: "single_select",
    question: "How did you hear about us?",
    options: [
      { value: "Google search", label: "Google search" },
      { value: "Instagram", label: "Instagram" },
      { value: "Referral from a friend", label: "Referral from a friend" },
      { value: "Existing client", label: "Existing client" },
      { value: "LinkedIn", label: "LinkedIn" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    id: "package",
    type: "package_select",
    question: "Which package fits your needs?",
    subtext: "You can always upgrade later. Pick what makes sense right now.",
  },
  {
    id: "primary_goal",
    type: "single_select",
    question: "What's the primary goal of this website?",
    subtext: "One answer — the most important one.",
    options: [
      { value: "Generate leads and calls", label: "Generate leads and calls" },
      { value: "Sell products online", label: "Sell products online" },
      { value: "Build credibility and trust", label: "Build credibility and trust" },
      { value: "Launch a new business or product", label: "Launch a new business or product" },
      { value: "Replace an outdated website", label: "Replace an outdated website" },
      { value: "Drive event or campaign traffic", label: "Drive event or campaign traffic" },
    ],
  },
  {
    id: "target_customer",
    type: "textarea",
    question: "Who is your ideal customer?",
    subtext: "Describe them in as much detail as you can. Age, location, what they care about, what problem they have that you solve.",
    required: true,
  },
  {
    id: "differentiator",
    type: "textarea",
    question: "What makes you different from your competitors?",
    subtext: "Be honest and specific. This becomes the backbone of your copy.",
    required: true,
  },
  {
    id: "competitor_refs",
    type: "textarea",
    question: "List 2–3 competitors or websites you admire.",
    subtext: "Names, URLs, or both. Tell us what you like about them if you can.",
  },
  {
    id: "pages",
    type: "multi_select",
    question: "Which pages do you need?",
    subtext: "Home and Contact are included in every build. Select any additional pages.",
    items: PAGES_OPTIONS,
    showIf: (a) => a.package === "full_website" || a.package === "brand_and_site",
  },
  {
    id: "has_copy",
    type: "single_select",
    question: "Do you have website copy written?",
    subtext: "Copy = the actual words / text that go on your site.",
    options: [
      { value: "Yes — it's ready to go", label: "Yes — it's ready to go" },
      { value: "I have rough notes and ideas", label: "I have rough notes and ideas" },
      { value: "No — starting from scratch", label: "No — starting from scratch" },
    ],
  },
  {
    id: "has_logo",
    type: "single_select",
    question: "Do you have a logo?",
    options: [
      { value: "Yes — finalized and ready", label: "Yes — finalized and ready" },
      { value: "Yes — but it needs work", label: "Yes — but it needs work" },
      { value: "No — I need one", label: "No — I need one" },
    ],
    showIf: (a) => a.package !== "brand_and_site",
  },
  {
    id: "has_photos",
    type: "single_select",
    question: "Do you have photos or images for the site?",
    options: [
      { value: "Yes — professional quality", label: "Yes — professional quality" },
      { value: "Yes — phone photos", label: "Yes — phone photos (we'll work with them)" },
      { value: "No — I need help with this", label: "No — I need help with this" },
    ],
  },
  {
    id: "brand_words",
    type: "textarea",
    question: "Describe your brand in 3–5 words.",
    subtext: "Think about how you want clients to feel when they land on your site. Examples: bold, trustworthy, fun, premium, no-nonsense.",
    required: true,
  },
  {
    id: "color_prefs",
    type: "textarea",
    question: "Any color preferences or existing brand colors?",
    subtext: "If you have hex codes, drop them here. If not, describe what you're drawn to — 'dark, moody, navy' or 'bright, clean, white and orange' etc.",
  },
  {
    id: "brand_assets",
    type: "textarea",
    question: "Do you have any existing brand assets?",
    subtext: "Logo files, fonts, brand guidelines, past designs. Drop a Google Drive / Dropbox link, or note what you have. You can also send files after.",
  },
  {
    id: "style_direction",
    type: "multi_select",
    question: "What style direction feels right?",
    subtext: "Pick up to 3.",
    items: STYLE_OPTIONS,
  },
  {
    id: "has_domain",
    type: "single_select",
    question: "Do you have a domain name?",
    options: [
      { value: "Yes — I own it", label: "Yes — I own it" },
      { value: "No — I need one", label: "No — I need one" },
      { value: "Not sure", label: "Not sure" },
    ],
  },
  {
    id: "has_hosting",
    type: "single_select",
    question: "Do you have web hosting?",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
      { value: "Not sure", label: "Not sure" },
    ],
  },
  {
    id: "integrations",
    type: "multi_select",
    question: "Any integrations or special features needed?",
    subtext: "Select all that apply.",
    items: INTEGRATION_OPTIONS,
  },
  {
    id: "platform_info",
    type: "info",
    question: "Your site will be hosted on Vercel.",
    subtext: "Here's why — and what that means for you.",
  },
  {
    id: "launch_timeline",
    type: "single_select",
    question: "When do you want to launch?",
    options: [
      { value: "ASAP — as fast as possible", label: "ASAP — as fast as possible" },
      { value: "Within 2–4 weeks", label: "Within 2–4 weeks" },
      { value: "Within 1–2 months", label: "Within 1–2 months" },
      { value: "Flexible — no hard date", label: "Flexible — no hard date" },
    ],
  },
  {
    id: "hard_deadline",
    type: "single_select",
    question: "Is there a hard external deadline?",
    subtext: "A launch event, grand opening, campaign date, etc.",
    options: [
      { value: "No hard deadline", label: "No hard deadline" },
      { value: "Yes — I'll share the date in notes", label: "Yes — I'll share the date in notes" },
    ],
  },
  {
    id: "extra_notes",
    type: "textarea",
    question: "Anything else we should know?",
    subtext: "Hard deadlines, specific concerns, things you've hated about past web experiences, anything. The more context, the better.",
  },
];

function canAdvanceQ(q: Question, answers: Answers): boolean {
  if (q.type === "info") return true;
  if (q.type === "text_fields") {
    const vals = (answers[q.id] as Record<string, string>) ?? {};
    return (q.fields ?? []).filter((f) => f.required).every((f) => vals[f.key]?.trim());
  }
  if (q.type === "package_select") return !!answers.package;
  if (q.type === "textarea") return q.required ? !!(answers[q.id] as string)?.trim() : true;
  if (q.type === "single_select") return !!answers[q.id];
  return true;
}

const STORAGE_KEY = "wfd_onboard_progress";

export default function OnboardPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [savedData, setSavedData] = useState<{ answers: Answers; step: number } | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (document.getElementById("onboard-css")) return;
    const s = document.createElement("style");
    s.id = "onboard-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  // On mount — check for saved progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { answers: Answers; step: number };
      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        setSavedData(parsed);
        setResumePrompt(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-save on every answer or step change
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step: stepIndex }));
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1800);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
  }, [answers, stepIndex]);

  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  const visibleQuestions = QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
  const q = visibleQuestions[stepIndex];
  const progress = Math.round((stepIndex / Math.max(visibleQuestions.length - 1, 1)) * 100);

  function setField(qId: string, key: string, val: string) {
    setAnswers((prev) => {
      const existing = (prev[qId] as Record<string, string>) ?? {};
      return { ...prev, [qId]: { ...existing, [key]: val } };
    });
  }

  function setAnswer(key: string, val: string | string[] | boolean) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }

  function toggleMulti(key: string, val: string) {
    const cur = (answers[key] as string[]) ?? [];
    const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    setAnswer(key, next);
  }

  function next() {
    if (!canAdvanceQ(q, answers)) return;
    if (stepIndex >= visibleQuestions.length - 1) { setDone(true); return; }
    setDir("fwd"); setStep(stepIndex + 1);
  }

  function back() {
    if (stepIndex === 0) return;
    setDir("back"); setStep(stepIndex - 1);
  }

  function setStep(i: number) {
    setStepIndex(i); setAnimKey((k) => k + 1);
  }

  async function submit() {
    setSubmitting(true);
    const contact = (answers.contact as Record<string, string>) ?? {};
    const payload = {
      first_name: contact.first_name ?? "",
      last_name: contact.last_name ?? "",
      business_name: contact.business_name ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      city: contact.city ?? "",
      state: contact.state ?? "",
      referral_source: answers.referral_source ?? "",
      package: answers.package ?? "",
      primary_goal: answers.primary_goal ?? "",
      target_customer: answers.target_customer ?? "",
      differentiator: answers.differentiator ?? "",
      competitor_refs: answers.competitor_refs ?? "",
      pages: answers.pages ?? [],
      has_copy: answers.has_copy ?? "",
      has_logo: answers.has_logo ?? "",
      has_photos: answers.has_photos ?? "",
      brand_words: answers.brand_words ?? "",
      color_prefs: answers.color_prefs ?? "",
      brand_assets: answers.brand_assets ?? "",
      style_direction: answers.style_direction ?? [],
      has_domain: answers.has_domain ?? "",
      has_hosting: answers.has_hosting ?? "",
      needs_form: true,
      integrations: answers.integrations ?? [],
      platform_pref: answers.platform_pref ?? "",
      launch_timeline: answers.launch_timeline ?? "",
      hard_deadline: answers.hard_deadline ?? "",
      extra_notes: answers.extra_notes ?? "",
    };

    try {
      const res = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const { portalToken } = await res.json();
      clearSaved();
      window.location.href = `/onboard/${portalToken}`;
    } catch {
      setSubmitting(false);
    }
  }

  const animClass = dir === "fwd" ? "q-enter" : "q-enter-back";

  // Resume prompt
  if (resumePrompt && savedData) {
    const savedContact = (savedData.answers.contact as Record<string, string>) ?? {};
    const savedPkg = PACKAGES.find((p) => p.value === savedData.answers.package);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="q-enter" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>👋</div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Welcome Back</p>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 28, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: 14 }}>
            {savedContact.first_name ? `Hey ${savedContact.first_name} —` : "You left off mid-way."}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 8 }}>
            You were on step <strong style={{ color: "var(--text-primary)" }}>{savedData.step + 1}</strong>
            {savedPkg ? ` and had selected the <strong style={{ color: 'var(--text-primary)' }}>${savedPkg.label}</strong>` : ""}.
            Pick up where you left off or start fresh.
          </p>
          {savedPkg && (
            <p style={{ fontSize: 13, color: "var(--accent)", marginBottom: 28 }}>Selected: {savedPkg.label}</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                setAnswers(savedData.answers);
                setStepIndex(savedData.step);
                setResumePrompt(false);
              }}
              style={{ padding: "14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-b)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Resume Where I Left Off →
            </button>
            <button
              onClick={() => {
                clearSaved();
                setResumePrompt(false);
                setSavedData(null);
              }}
              style={{ padding: "13px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-b)", fontSize: 13.5, cursor: "pointer" }}
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    const contact = (answers.contact as Record<string, string>) ?? {};
    const pkg = PACKAGES.find((p) => p.value === answers.package);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="q-enter" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔥</div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Wood Fired Designs</p>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 32, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: 14 }}>
            You&apos;re all set,<br />{contact.first_name || "friend"}.
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 12 }}>
            You selected the <strong style={{ color: "var(--text-primary)" }}>{pkg?.label}</strong>. Once you confirm below, your project scope and contract will be ready to sign — then you&apos;re officially in the queue.
          </p>
          {pkg && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", marginBottom: 32, textAlign: "left", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {pkg.includes.map((d) => (
                  <span key={d} style={{ fontSize: 11.5, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 99 }}>{d}</span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={submit}
            disabled={submitting}
            style={{ display: "block", width: "100%", padding: "15px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1, marginBottom: 10 }}
          >
            {submitting ? "Saving your project…" : "Generate My Contract →"}
          </button>
          <button onClick={() => { setDone(false); setDir("back"); setStep(visibleQuestions.length - 1); }} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12.5, cursor: "pointer" }}>
            ← Go back and edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrap" style={{ fontFamily: "var(--font-b)" }}>
      {/* Left — questions */}
      <div className="q-panel">
        <div style={{ height: 3, background: "var(--bg-elevated)", flexShrink: 0 }}>
          <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 0.35s var(--ease)" }} />
        </div>
        <div className="q-inner" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 52px", maxWidth: 600 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Step {stepIndex + 1} of {visibleQuestions.length}
            </p>
            <p style={{ fontSize: 11, color: justSaved ? "var(--accent)" : "transparent", transition: "color 0.4s", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✓ Progress saved
            </p>
          </div>

          <div key={animKey} className={animClass} style={{ flex: 1 }}>
            <h2 className="q-headline" style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: q.subtext ? 10 : 28 }}>
              {q.question}
            </h2>
            {q.subtext && <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 24 }}>{q.subtext}</p>}

            {/* Info slide */}
            {q.type === "info" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "⚡", title: "Global Edge Network", body: "Vercel deploys your site to 100+ edge locations worldwide. Pages load in milliseconds anywhere on the planet — no shared hosting slowdowns." },
                  { icon: "🔒", title: "HTTPS Everywhere, Automatically", body: "SSL certificates are provisioned and renewed automatically. Your site is secure out of the box with zero configuration on your end." },
                  { icon: "📈", title: "Scales With You", body: "Whether you get 10 visitors or 10,000 in a day, Vercel handles it without any plan upgrades or server management from you." },
                  { icon: "🔁", title: "Instant Deploys & Rollbacks", body: "Every update goes live in seconds. If anything ever looks wrong, we can roll back to any previous version instantly." },
                  { icon: "🏆", title: "Used by the Best", body: "Vercel powers sites for Nike, Lego, The Washington Post, and thousands of high-growth brands. It's the gold standard for modern web hosting." },
                ].map(({ icon, title, body }) => (
                  <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{title}</p>
                      <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text fields */}
            {q.type === "text_fields" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {q.fields?.map((f) => (
                  <div key={f.key}>
                    <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 5 }}>{f.label}{f.required ? " *" : ""}</p>
                    <input
                      className="field-input"
                      type={f.key === "email" ? "email" : "text"}
                      placeholder={f.placeholder ?? ""}
                      value={((answers[q.id] as Record<string, string>) ?? {})[f.key] ?? ""}
                      onChange={(e) => setField(q.id, f.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            {q.type === "textarea" && (
              <textarea
                className="field-input"
                placeholder="Type your answer here…"
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}

            {/* Package select */}
            {q.type === "package_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PACKAGES.map((pkg) => (
                  <div key={pkg.value} className={`pkg-card${answers.package === pkg.value ? " selected" : ""}`} onClick={() => setAnswer("package", pkg.value)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <p style={{ fontFamily: "var(--font-d)", fontSize: 16, color: "var(--text-primary)", letterSpacing: "0.01em" }}>{pkg.label}</p>
                      <div style={{ display: "flex", gap: 6 }}>
                        {pkg.badge && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99 }}>{pkg.badge}</span>}
                        <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 99 }}>{pkg.turnaround}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 8 }}>{pkg.subtext}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {pkg.includes.map((d) => (
                        <span key={d} style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 9px", borderRadius: 99 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single select */}
            {q.type === "single_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options?.map((opt) => (
                  <div key={opt.value} className={`opt-card${answers[q.id] === opt.value ? " selected" : ""}`} onClick={() => setAnswer(q.id, opt.value)}>
                    <div className="opt-radio" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</p>
                      {opt.subtext && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{opt.subtext}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Multi select */}
            {q.type === "multi_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(q.items ?? []).map((item) => {
                  const sel = ((answers[q.id] as string[]) ?? []).includes(item);
                  return (
                    <div key={item} className={`opt-card${sel ? " selected" : ""}`} onClick={() => toggleMulti(q.id, item)}>
                      <div className="opt-check">
                        {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{item}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="controls-bar" style={{ display: "flex", gap: 10, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            {stepIndex > 0 && <button className="btn-ghost" onClick={back}>← Back</button>}
            <button className="btn-primary" onClick={next} disabled={!canAdvanceQ(q, answers)} style={{ marginLeft: stepIndex > 0 ? 0 : "auto" }}>
              {stepIndex >= visibleQuestions.length - 1 ? "Review & Submit →" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* Right — scope panel (hidden on mobile) */}
      <div className="scope-panel">
        <div className="scope-inner">
          <ScopePanel answers={answers} />
        </div>
      </div>
    </div>
  );
}
