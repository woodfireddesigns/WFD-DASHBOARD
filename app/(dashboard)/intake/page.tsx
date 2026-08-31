"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { T, card, ghostButton, pill, modalOverlay, modalBox, wash } from "@/lib/theme";
import {
  ClipboardList, Copy, Check, ExternalLink, Sparkles, Loader2, X,
  Inbox, Link2, Search,
} from "lucide-react";

/**
 * Everything intake, in one tab.
 *
 * The tab used to be a link hub and nothing else: seven forms, seven copy
 * buttons, and no sign anywhere in the dashboard of what people had actually
 * sent back. Two dozen submissions were sitting in `intake_forms` with no
 * screen that read them — the only way to see one was the client's own portal
 * link. So the hub keeps its half, and the submissions get theirs.
 */

// ── Submissions ──────────────────────────────────────────────────────────────

interface Submission {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  referral_source: string | null;
  package: string;
  package_price: number;
  form_type: string;
  status: string;
  signed_name: string | null;
  signed_at: string | null;
  deposit_paid: boolean | null;
  full_paid: boolean | null;
  portal_token: string | null;
  project_id: string | null;
  primary_goal: string | null;
  target_customer: string | null;
  differentiator: string | null;
  competitor_refs: string | null;
  pages: string[] | null;
  has_copy: string | null;
  has_logo: string | null;
  has_photos: string | null;
  brand_words: string | null;
  color_prefs: string | null;
  brand_assets: string | null;
  style_direction: string[] | null;
  has_domain: string | null;
  has_hosting: string | null;
  needs_form: boolean | null;
  integrations: string[] | null;
  platform_pref: string | null;
  launch_timeline: string | null;
  hard_deadline: string | null;
  extra_notes: string | null;
}

/** Which long-form answers to show, and what to call them. */
const DETAIL_FIELDS: [keyof Submission, string][] = [
  ["primary_goal", "Primary goal"],
  ["target_customer", "Target customer"],
  ["differentiator", "What makes them different"],
  ["competitor_refs", "Competitors / references"],
  ["pages", "Pages"],
  ["has_copy", "Copy ready"],
  ["has_logo", "Logo"],
  ["has_photos", "Photography"],
  ["brand_words", "Brand words"],
  ["color_prefs", "Colour preferences"],
  ["brand_assets", "Existing assets"],
  ["style_direction", "Style direction"],
  ["has_domain", "Domain"],
  ["has_hosting", "Hosting"],
  ["needs_form", "Needs a contact form"],
  ["integrations", "Integrations"],
  ["platform_pref", "Platform preference"],
  ["launch_timeline", "Timeline"],
  ["hard_deadline", "Hard deadline"],
  ["referral_source", "Heard about us via"],
  ["extra_notes", "Anything else"],
];

const FORM_TYPE_COLOR: Record<string, string> = {
  web: "#5B9BD5",
  design: "#A78BFA",
  quick: "#FF6B2B",
  retainer: "#E8A33D",
  audit: "#3FB86B",
};

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function show(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.length === 0 ? null : value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function StatusPills({ s }: { s: Submission }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      <span style={pill(FORM_TYPE_COLOR[s.form_type] ?? T.muted)}>{s.form_type}</span>
      <span style={pill(s.signed_at !== null ? T.success : T.muted)}>
        {s.signed_at !== null ? "signed" : "unsigned"}
      </span>
      <span style={pill(s.full_paid === true ? T.success : s.deposit_paid === true ? T.warning : T.muted)}>
        {s.full_paid === true ? "paid in full" : s.deposit_paid === true ? "deposit paid" : "unpaid"}
      </span>
    </div>
  );
}

function SubmissionDetail({ s, origin, onClose }: { s: Submission; origin: string; onClose: () => void }) {
  const rows = DETAIL_FIELDS
    .map(([key, label]) => [label, show(s[key])] as const)
    .filter((r): r is readonly [string, string] => r[1] !== null);

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...modalBox, maxWidth: 620 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 19, color: T.text }}>
              {s.first_name} {s.last_name}
            </h2>
            {s.business_name && (
              <p style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>{s.business_name}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginTop: 12 }}><StatusPills s={s} /></div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          marginTop: 16, padding: "14px 16px",
          background: T.raised, borderRadius: 10,
        }}>
          {([
            ["Package", s.package],
            ["Price", s.package_price > 0 ? `$${s.package_price.toLocaleString()}` : "—"],
            ["Email", s.email],
            ["Phone", s.phone ?? "—"],
            ["Location", [s.city, s.state].filter(Boolean).join(", ") || "—"],
            ["Submitted", new Date(s.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
          ] as const).map(([label, value]) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
              <p style={{ fontSize: 12.5, color: T.text, marginTop: 3, wordBreak: "break-word" }}>{value}</p>
            </div>
          ))}
        </div>

        {rows.length > 0 && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: 10.5, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {s.portal_token !== null && (
          <a
            href={`${origin}/portal/${s.portal_token}`}
            target="_blank"
            rel="noreferrer"
            style={{
              ...ghostButton, marginTop: 20, display: "inline-flex",
              alignItems: "center", gap: 6, textDecoration: "none",
            }}
          >
            <ExternalLink size={12} /> Open their portal
          </a>
        )}
      </div>
    </div>
  );
}

function Submissions({ origin }: { origin: string }) {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Submission | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unsigned" | "unpaid">("all");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("intake_forms")
      .select("*")
      .order("created_at", { ascending: false });
    setError(err?.message ?? null);
    setRows((data as Submission[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((s) => {
    if (filter === "unsigned" && s.signed_at !== null) return false;
    if (filter === "unpaid" && s.full_paid === true) return false;
    if (needle === "") return true;
    return [s.first_name, s.last_name, s.business_name, s.email, s.package]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(needle));
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "50px 0", color: T.muted }}>
        <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div style={{ ...card, textAlign: "center", padding: "28px 20px" }}>
        <p style={{ fontSize: 13, color: T.danger }}>Could not load submissions.</p>
        <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 200,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 11px",
        }}>
          <Search size={13} color={T.muted} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, business, email…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 12.5, fontFamily: T.body }}
          />
        </div>
        {(["all", "unsigned", "unpaid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            style={{
              ...ghostButton, padding: "7px 13px", fontSize: 12,
              borderColor: filter === f ? T.brand : T.border,
              color: filter === f ? T.brand : T.text2,
              backgroundColor: filter === f ? T.brandWash : "transparent",
            }}
          >
            {f === "all" ? "All" : f === "unsigned" ? "Unsigned" : "Unpaid"}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "36px 20px" }}>
          <p style={{ fontSize: 13, color: T.text2 }}>
            {rows.length === 0 ? "No submissions yet." : "Nothing matches that."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shown.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpen(s)}
              style={{
                ...card, textAlign: "left", cursor: "pointer", fontFamily: T.body,
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderHover)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>
                  {s.first_name} {s.last_name}
                  {s.business_name && <span style={{ color: T.muted, fontWeight: 400 }}> · {s.business_name}</span>}
                </p>
                <p style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>
                  {s.package} · {timeAgo(s.created_at)}
                </p>
              </div>
              <p style={{ fontFamily: T.mono, fontSize: 13, color: T.text2 }}>
                {s.package_price > 0 ? `$${s.package_price.toLocaleString()}` : "—"}
              </p>
              <StatusPills s={s} />
            </button>
          ))}
        </div>
      )}

      {open !== null && <SubmissionDetail s={open} origin={origin} onClose={() => setOpen(null)} />}
    </div>
  );
}

// ── The link hub ─────────────────────────────────────────────────────────────

type Form = {
  href: string;
  label: string;
  blurb: string;
  bestFor: string;
  time: string;
  lands: string;
  accent: string;
  isNew?: boolean;
  /** Needs a project id appended, so copying the bare link is not enough. */
  perProject?: boolean;
};

const FORMS: Form[] = [
  {
    href: "/audit", label: "Free Brand & Site Audit", accent: "#3FB86B", isNew: true,
    time: "90 sec", lands: "Pipeline board",
    blurb: "A free written audit in exchange for an email. Nothing to buy, so nothing to refuse.",
    bestFor: "Cold outreach, Instagram DMs, anyone not ready to talk money",
  },
  {
    href: "/quick", label: "Quick Quote", accent: "#FF6B2B",
    time: "3 min", lands: "Submissions + draft project",
    blurb: "Service, style, timeline. Enough for a real number without full discovery.",
    bestFor: "Warm prospects who already know roughly what they want",
  },
  {
    href: "/onboard", label: "UX Intake", accent: "#5B9BD5",
    time: "5 min", lands: "Submissions + draft project",
    blurb: "Full website discovery — goals, pages, audience, brand, domain, hosting.",
    bestFor: "Website and brand-plus-web clients",
  },
  {
    href: "/design", label: "Design Intake", accent: "#A78BFA",
    time: "8 min", lands: "Submissions + draft project",
    blurb: "Deep creative discovery that branches by service. Scope and price build live as they answer.",
    bestFor: "Brand identity, packaging, photography, merch",
  },
  {
    href: "/retainer", label: "Monthly Retainer", accent: "#E8A33D", isNew: true,
    time: "4 min", lands: "Pipeline board",
    blurb: "Scopes ongoing work — social, ad creative, store management. The only form that captures recurring revenue.",
    bestFor: "Anyone who needs something running every month, not built once",
  },
  {
    href: "/kickoff", label: "Project Kickoff Pack", accent: "#E2564A", isNew: true, perProject: true,
    time: "5 min", lands: "Appended to the project",
    blurb: "Sent after signature. Collects DNS access, brand files, who signs off and how fast they turn feedback — in writing, on day one.",
    bestFor: "Every signed project, the day the contract comes back",
  },
  {
    href: "/for/indigo-leather/questionnaire", label: "Indigo Leather Discovery", accent: "#C09B52",
    time: "10 min", lands: "Submissions + draft project",
    blurb: "Client-branded deep discovery. A template worth cloning per client for high-value work.",
    bestFor: "One named client — clone the pattern for others",
  },
];

function CopyLink({ url, disabled }: { url: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        navigator.clipboard.writeText(url)
          .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })
          .catch(() => {});
      }}
      style={{
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        fontSize: 11, fontWeight: 500, padding: "6px 11px", borderRadius: 7,
        border: `1px solid ${copied ? T.success : T.border}`,
        background: copied ? wash(T.success) : T.raised,
        color: disabled ? T.faint : copied ? T.success : T.text2,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: T.body, transition: "all 0.15s",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function LinkHub({ origin }: { origin: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* The one link — the whole point of the section, so it goes first and big. */}
      <div style={{
        ...card, padding: 20,
        border: `1px solid ${T.brandEdge}`,
        background: `linear-gradient(135deg, ${wash(T.brand, 0.08)}, ${T.surface} 60%)`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <Sparkles size={13} color={T.brand} />
              <p style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                The one link
              </p>
            </div>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.55, maxWidth: 460 }}>
              Send this instead of picking a form. It asks what they need and routes them —
              audit, quote, website, creative or retainer. Every path saves as it goes.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <a
              href="/start" target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
                fontSize: 11, fontWeight: 500, padding: "6px 11px", borderRadius: 7,
                border: `1px solid ${T.border}`, background: T.raised, color: T.text2,
              }}
            >
              <ExternalLink size={11} /> Preview
            </a>
            <CopyLink url={`${origin}/start`} disabled={origin === ""} />
          </div>
        </div>
        <code style={{
          display: "block", marginTop: 14, fontFamily: T.mono, fontSize: 12,
          color: T.text, background: T.sunken, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "9px 12px", overflowX: "auto",
        }}>
          {origin || "…"}/start
        </code>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ClipboardList size={13} color={T.muted} />
          <h2 style={{
            fontSize: 11, fontWeight: 600, color: T.muted,
            textTransform: "uppercase", letterSpacing: "0.1em",
            fontFamily: T.body,
          }}>
            Every form
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 10 }}>
          {FORMS.map((f) => {
            const url = `${origin}${f.href}`;
            return (
              <div key={f.href} style={{ ...card, padding: 16, borderTop: `2px solid ${f.accent}`, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 14.5, fontWeight: 600, color: T.text, lineHeight: 1.25 }}>{f.label}</h3>
                      {f.isNew && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                          padding: "2px 6px", borderRadius: 4, background: T.brand, color: "#fff",
                        }}>
                          New
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, fontFamily: T.mono, color: T.muted, marginTop: 4 }}>
                      {f.time} · lands in {f.lands}
                    </p>
                  </div>
                  <a
                    href={f.href} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: T.muted, textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    Preview <ExternalLink size={10} />
                  </a>
                </div>

                <p style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55, marginBottom: 8 }}>{f.blurb}</p>
                <p style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.55, marginBottom: 12, flex: 1 }}>
                  <span style={{ textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Best for:</span> {f.bestFor}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{
                    flex: 1, fontSize: 10.5, fontFamily: T.mono, color: T.muted,
                    background: T.sunken, borderRadius: 6, padding: "6px 9px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {f.perProject ? `${url}?p=<project id>` : url}
                  </code>
                  <CopyLink url={url} disabled={origin === ""} />
                </div>

                {f.perProject && (
                  <p style={{ fontSize: 10.5, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
                    Works on its own — it matches the client by email. Add{" "}
                    <code style={{ fontFamily: T.mono }}>?p=</code> and a project id to attach it to a
                    specific project instead.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

/** The page's own origin, so copied links work on localhost and in production. */
const subscribeNever = () => () => {};

export default function IntakePage() {
  const [tab, setTab] = useState<"submissions" | "links">("submissions");
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");

  return (
    <div style={{ maxWidth: 1080, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "inline-flex", alignSelf: "flex-start", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
        {([
          { id: "submissions", label: "Submissions", icon: Inbox },
          { id: "links", label: "Send a form", icon: Link2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12.5, fontWeight: 500, fontFamily: T.body, transition: "all 0.15s",
              backgroundColor: tab === id ? T.brand : "transparent",
              color: tab === id ? "#fff" : T.text2,
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "submissions" ? <Submissions origin={origin} /> : <LinkHub origin={origin} />}
    </div>
  );
}
