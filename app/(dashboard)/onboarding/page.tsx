"use client";

import { useState } from "react";
import { CheckSquare, Copy, ChevronDown, ChevronUp } from "lucide-react";

// ── Sequence templates ────────────────────────────────────────────────────────

const SEQUENCES = [
  {
    id: "full",
    label: "Full Project Onboard",
    description: "Brand + Web Bundle or full-scope projects",
    color: "#FF6B2B",
    steps: [
      { day: 0,  label: "Contract Sent",        note: "Send contract via DocuSign or PDF. Include scope, timeline, payment terms." },
      { day: 0,  label: "Invoice #1 Sent",       note: "50% deposit due before work begins. Send with contract." },
      { day: 1,  label: "Welcome Email",         note: "Introduce yourself as the person doing the work. Set expectations on timeline and communication." },
      { day: 2,  label: "Kickoff Questionnaire", note: "Send brand questionnaire: target audience, competitors, adjectives, logo refs, color preferences." },
      { day: 5,  label: "Discovery Call",        note: "30-min call to review questionnaire answers, ask follow-up questions, confirm scope." },
      { day: 14, label: "First Concepts",        note: "Deliver 2–3 initial directions. Request feedback within 5 business days." },
      { day: 21, label: "Revision Round 1",      note: "Incorporate feedback. Confirm direction moving forward." },
      { day: 28, label: "Invoice #2 Sent",       note: "Final 50% due on delivery. Send with draft files." },
      { day: 30, label: "Final Delivery",        note: "Send all final files, brand guide, any handoff documentation." },
      { day: 37, label: "Follow-Up",             note: "Check in. Ask for a testimonial. Introduce MRR upsell if appropriate." },
    ],
  },
  {
    id: "website",
    label: "Website Only",
    description: "Starter Site or Full Website",
    color: "#1E5FAA",
    steps: [
      { day: 0,  label: "Contract + Invoice",    note: "50% upfront. Attach scope doc with page list and features." },
      { day: 1,  label: "Welcome Email",         note: "Confirm start date, what you need from them (copy, photos, login access)." },
      { day: 2,  label: "Content Request",       note: "Send a simple list of what you need: logo files, copy, photos, any existing brand assets." },
      { day: 5,  label: "Design Preview",        note: "Share homepage wireframe or mockup for approval before build." },
      { day: 7,  label: "Build Begins",          note: "Begin dev. Share staging link when structure is in place." },
      { day: 12, label: "Staging Review",        note: "Walk client through the staging site. Collect revisions." },
      { day: 14, label: "Final Invoice",         note: "50% balance due before go-live." },
      { day: 15, label: "Go Live",               note: "Deploy to production. Confirm domain, SSL, analytics." },
      { day: 22, label: "Check-In",              note: "Make sure everything is working. Ask for a Google review." },
    ],
  },
  {
    id: "photo",
    label: "AI Photography",
    description: "Product photography package",
    color: "#1E7A3C",
    steps: [
      { day: 0,  label: "Invoice Sent",          note: "Full payment upfront for photography packages." },
      { day: 1,  label: "Brief Form",            note: "Send product brief: what they're selling, desired mood, surface/background preferences, usage (web, social, print)." },
      { day: 3,  label: "Style Concepts",        note: "Share 3 mood board directions for approval." },
      { day: 5,  label: "Production",            note: "Generate images. Aim for 10–15 selects per product SKU." },
      { day: 7,  label: "Delivery",              note: "Send gallery link + full resolution downloads. Include usage guide." },
      { day: 14, label: "Follow-Up",             note: "Check how images performed. Offer a second round or social content system upsell." },
    ],
  },
  {
    id: "retainer",
    label: "MRR Retainer Setup",
    description: "Converting a project client to monthly",
    color: "#6B6560",
    steps: [
      { day: 0,  label: "Retainer Proposal",     note: "Send a clear one-pager: what's included monthly, what's not, response time SLA, price." },
      { day: 2,  label: "Contract Signed",       note: "Month-to-month or 3-month minimum. Auto-renewing. 30-day cancellation notice." },
      { day: 3,  label: "First Invoice",         note: "First month billed on signing. Subsequent months billed on the 1st." },
      { day: 4,  label: "Onboarding Call",       note: "Set up recurring check-in cadence. Agree on what 'a month of work' looks like." },
      { day: 30, label: "Month 1 Review",        note: "Review what was done. Confirm value. Ask if scope needs adjusting." },
    ],
  },
];

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button onClick={copy}
      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: copied ? "#1E7A3C" : "#A09890", background: "none", border: "none", cursor: "pointer", padding: "3px 0", transition: "color 0.15s" }}>
      <Copy size={11} />{copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Email templates ───────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    label: "Welcome Email",
    subject: "We're officially kicking off — here's what's next",
    body: `Hey [Name],

Really glad to have you on board. I'm Michael — and I'm the one doing all the work, not a project manager passing things along.

Here's what happens next:
- I'll send over a short questionnaire to get what I need from you
- We'll jump on a quick call to align on direction
- From there, you'll see first concepts within [X] days

One thing I always tell clients: the faster you can get me feedback, the faster you get results. I move quickly when you move quickly.

Looking forward to building something great for [Business Name].

— Michael
Wood Fired Designs
woodfireddesigns.com`,
  },
  {
    id: "brief",
    label: "Brand Questionnaire",
    subject: "Quick questions before we dive in",
    body: `Hey [Name],

Before I start designing, I need to understand [Business Name] properly. Take 10–15 minutes with these questions — the more specific, the better.

1. Who is your ideal customer? Be specific. Age, lifestyle, what they care about.
2. Who are your competitors? Share 2–3 and tell me what you like or don't like about their branding.
3. Three words that should describe your brand's personality.
4. Any brands (outside your industry) whose visual style you admire?
5. Colors you love, and colors that are absolutely off the table.
6. Any existing materials I should reference (old logo, website, packaging)?

No wrong answers. Just be honest — it saves revision rounds later.

— Michael`,
  },
  {
    id: "followup",
    label: "Post-Delivery Follow-Up",
    subject: "How's everything landing?",
    body: `Hey [Name],

It's been [X] weeks since delivery — wanted to check in and make sure everything is working the way it should.

A couple of things:
- If anything needs a small tweak, just say the word.
- If you're happy with the work, a Google review would mean a lot: [your Google review link]

Also — if you ever need ongoing creative support (social content, campaign assets, a second round of photography), that's something I offer on a monthly basis. Happy to walk you through what that looks like if it's relevant.

Either way, it was a pleasure working on [Business Name].

— Michael`,
  },
  {
    id: "upsell",
    label: "MRR Upsell Pitch",
    subject: "Keeping your brand sharp every month",
    body: `Hey [Name],

Now that the [project] is wrapped, I wanted to put something on your radar.

A lot of my clients find that the hardest part isn't launching — it's keeping momentum after. Content goes stale, ads need refreshing, new products need photos.

I offer a monthly creative retainer that covers exactly that: a set number of deliverables each month (social assets, ad creative, photography, whatever you need most) for a flat rate. No project-by-project back-and-forth.

It starts at $[X]/month. Happy to put together a quick breakdown of what that would look like for [Business Name] specifically if you're curious.

No pressure — just wanted to plant the seed.

— Michael`,
  },
];

// ── Sequence card ─────────────────────────────────────────────────────────────

function SequenceCard({ seq }: { seq: typeof SEQUENCES[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, overflow: "hidden" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: seq.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1E1C1A" }}>{seq.label}</p>
          <p style={{ fontSize: 11.5, color: "#A09890", marginTop: 1 }}>{seq.description} · {seq.steps.length} steps</p>
        </div>
        {open ? <ChevronUp size={14} color="#A09890" /> : <ChevronDown size={14} color="#A09890" />}
      </button>

      {/* Steps */}
      {open && (
        <div style={{ borderTop: "1px solid #E8E2D8" }}>
          {seq.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "12px 18px", borderTop: i > 0 ? "1px solid #F0EBE1" : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: 99, backgroundColor: "#F0EBE1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: seq.color }}>
                    {step.day === 0 ? "D0" : `D${step.day}`}
                  </span>
                </div>
                {i < seq.steps.length - 1 && (
                  <div style={{ width: 1, flex: 1, backgroundColor: "#E8E2D8", marginTop: 4, minHeight: 12 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1E1C1A" }}>{step.label}</p>
                  <CheckSquare size={12} color="#C8C0B8" />
                </div>
                <p style={{ fontSize: 12, color: "#6B6560", lineHeight: 1.5 }}>{step.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Email template card ───────────────────────────────────────────────────────

function EmailCard({ tmpl }: { tmpl: typeof EMAIL_TEMPLATES[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1E1C1A" }}>{tmpl.label}</p>
          <p style={{ fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", color: "#A09890", marginTop: 1 }}>Subject: {tmpl.subject}</p>
        </div>
        {open ? <ChevronUp size={14} color="#A09890" /> : <ChevronDown size={14} color="#A09890" />}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #E8E2D8", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#A09890" }}>Subject: {tmpl.subject}</p>
            <CopyButton text={`Subject: ${tmpl.subject}\n\n${tmpl.body}`} />
          </div>
          <pre style={{ fontSize: 12.5, color: "#3D3A38", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif", margin: 0, backgroundColor: "#F8F5F0", padding: "14px 16px", borderRadius: 8, border: "1px solid #E8E2D8" }}>
            {tmpl.body}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [tab, setTab] = useState<"sequences" | "emails">("sequences");

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Intro */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, padding: "18px 22px" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1E1C1A", marginBottom: 4 }}>Client Sequences & Templates</p>
        <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.6 }}>
          Playbooks for every client type. Open a sequence to see each step and what to do on each day.
          Email templates are ready to copy, personalize, and send.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, padding: 3, gap: 2, width: "fit-content" }}>
        {(["sequences", "emails"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500, textTransform: "capitalize", transition: "all 0.15s", backgroundColor: tab === t ? "#1E1C1A" : "transparent", color: tab === t ? "#fff" : "#6B6560" }}>
            {t === "sequences" ? "Onboarding Sequences" : "Email Templates"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tab === "sequences"
          ? SEQUENCES.map((s) => <SequenceCard key={s.id} seq={s} />)
          : EMAIL_TEMPLATES.map((t) => <EmailCard key={t.id} tmpl={t} />)
        }
      </div>
    </div>
  );
}
