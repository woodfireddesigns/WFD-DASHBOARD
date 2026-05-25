"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  ExternalLink, Eye, Mail, Zap, Globe, Phone, RefreshCw,
  MousePointerClick, MailOpen, MessageSquareCheck, Users,
  TrendingUp, AlertCircle, Search, X, ChevronDown, ChevronUp,
  ChevronsUpDown, Filter, CheckSquare, Square, MoreHorizontal,
  RotateCcw, Send,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoofingLead {
  id: string;
  business_name: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  score: number;
  grade: string;
  brand_primary_color: string | null;
  slug: string | null;
  sequence_status: string | null;
  sequence_step: number | null;
  last_outreach_at: string | null;
  next_outreach_at: string | null;
  response_received: boolean | null;
  click_count: number | null;
  open_count: number | null;
  owner_name: string | null;
  google_review_count: number | null;
  google_star_rating: number | null;
}

type SortKey = "score" | "business_name" | "city" | "google_review_count" | "open_count" | "next_outreach_at" | "last_outreach_at";
type SortDir = "asc" | "desc";
type Tab = "ready" | "active" | "done";
type GradeFilter = "all" | "A" | "B" | "C";

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  A: { bg: "#ECFBF0", color: "#1E7A3C" },
  B: { bg: "#EEF4FF", color: "#1E5FAA" },
  C: { bg: "#F0EBE1", color: "#6B6560" },
};

const SELECT = "id,business_name,website_url,email,phone,city,state,score,grade,brand_primary_color,slug,sequence_status,sequence_step,last_outreach_at,next_outreach_at,response_received,click_count,open_count,owner_name,google_review_count,google_star_rating";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function dueLabel(iso: string | null): { label: string; style: React.CSSProperties } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  const hrs = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (ms <= 0)  return { label: "Due Now", style: { backgroundColor: "#FDECEA", color: "#C0392B" } };
  if (hrs < 24) return { label: `${hrs}h`, style: { backgroundColor: "#FEF3E2", color: "#B86B10" } };
  return { label: `${days}d`, style: { backgroundColor: "#F0EBE1", color: "#A09890" } };
}

function getFirstName(lead: RoofingLead): string | null {
  if (lead.owner_name) return lead.owner_name.split(" ")[0];
  if (lead.email) {
    const part = lead.email.split("@")[0].split(/[._\-+]/)[0].replace(/[^a-zA-Z]/g, "");
    const generic = ["info","hello","contact","admin","office","mail","support","team","sales","no","noreply"];
    if (part.length >= 3 && !generic.includes(part.toLowerCase())) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
  }
  return null;
}

function buildEmail(lead: RoofingLead, step: number): { subject: string; body: string } {
  const name = getFirstName(lead);
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const url = `https://app.woodfireddesigns.com/roofing/${lead.slug}?ref=email`;
  const subjects = [
    `Question regarding ${lead.business_name}`,
    `Quick follow up - ${lead.business_name}`,
    `One last thing for ${lead.business_name}`,
  ];
  const bodies: Record<number, string> = {
    1: lead.website_url
      ? `${greeting}\n\nI was looking at your website and noticed the mobile performance could be improved. I built a high-speed preview of what a modern ${lead.business_name} site could look like for the ${lead.city} market.\n\nLive preview:\n${url}\n\nWhat do you think?\n\nP.S. If you'd rather not hear from me, just say the word.`
      : `${greeting}\n\nI was researching roofing companies in ${lead.city} and noticed ${lead.business_name} doesn't have a website. I built a free preview of what one could look like for you.\n\nLive preview:\n${url}\n\nP.S. If you'd rather not hear from me, just say the word.`,
    2: `${greeting}\n\nJust following up on the preview I sent:\n${url}\n\nWould a site like this help you stand out in ${lead.city}? Happy to walk you through it.`,
    3: `${greeting}\n\nLast one from me. Here's the preview:\n${url}\n\nIf timing's off, no worries — the link stays live.`,
  };
  return { subject: subjects[step - 1], body: bodies[step] };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={10} color="#C8C0B8" />;
  return sortDir === "asc" ? <ChevronUp size={10} color="#FF6B2B" /> : <ChevronDown size={10} color="#FF6B2B" />;
}

function KpiCard({ icon: Icon, label, value, accent, sub }: { icon: React.ElementType; label: string; value: number; accent: string; sub?: string }) {
  return (
    <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${accent}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={accent} strokeWidth={1.75} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1E1C1A", lineHeight: 1, fontFamily: "Anton, sans-serif", letterSpacing: "0.025em" }}>{value.toLocaleString()}</div>
        <div style={{ fontSize: 10, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "#C8C0B8", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SequenceBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: i <= step ? "#1E5FAA" : "#E8E2D8" }} />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads]           = useState<RoofingLead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [syncing, setSyncing]       = useState(false);
  const [tab, setTab]               = useState<Tab>("ready");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("score");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadLeads = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("roofing_leads")
      .select(SELECT)
      .order("score", { ascending: false });
    if (err) { setError(err.message); return; }
    setLeads((data as RoofingLead[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadLeads();
      setLoading(false);
    })();
  }, [loadLeads]);

  // Supabase real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("roofing_leads_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "roofing_leads" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setLeads((prev) => prev.map((l) => l.id === (payload.new as RoofingLead).id ? { ...l, ...(payload.new as RoofingLead) } : l));
        } else if (payload.eventType === "INSERT") {
          setLeads((prev) => [payload.new as RoofingLead, ...prev]);
        } else if (payload.eventType === "DELETE") {
          setLeads((prev) => prev.filter((l) => l.id !== (payload.old as { id: string }).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const readyLeads  = useMemo(() => leads.filter((l) => !l.sequence_status || l.sequence_status === "none" || l.sequence_status === "pending"), [leads]);
  const activeLeads = useMemo(() => leads.filter((l) => l.sequence_status === "active" || l.sequence_status === "replied"), [leads]);
  const doneLeads   = useMemo(() => leads.filter((l) => l.sequence_status === "completed"), [leads]);
  const tabLeads    = tab === "ready" ? readyLeads : tab === "active" ? activeLeads : doneLeads;

  const states = useMemo(() => {
    const s = new Set(leads.map((l) => l.state).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    let list = [...tabLeads];
    if (gradeFilter !== "all") list = list.filter((l) => l.grade === gradeFilter);
    if (stateFilter !== "all") list = list.filter((l) => l.state === stateFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        (l.business_name ?? "").toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.state ?? "").toLowerCase().includes(q)
      );
    }
    // Sorting
    list.sort((a, b) => {
      let av: string | number | null = a[sortKey] as string | number | null;
      let bv: string | number | null = b[sortKey] as string | number | null;
      if (sortKey === "next_outreach_at") {
        av = av ? new Date(av as string).getTime() : Infinity;
        bv = bv ? new Date(bv as string).getTime() : Infinity;
      }
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [tabLeads, gradeFilter, stateFilter, search, sortKey, sortDir]);

  // Active tab: overdue leads pinned to top
  const sortedFiltered = useMemo(() => {
    if (tab !== "active") return filtered;
    return [...filtered].sort((a, b) => {
      const aDue = a.next_outreach_at ? new Date(a.next_outreach_at).getTime() : Infinity;
      const bDue = b.next_outreach_at ? new Date(b.next_outreach_at).getTime() : Infinity;
      const aOvr = aDue <= Date.now();
      const bOvr = bDue <= Date.now();
      if (aOvr && !bOvr) return -1;
      if (!aOvr && bOvr) return 1;
      return aDue - bDue;
    });
  }, [filtered, tab]);

  const stats = useMemo(() => ({
    total:   leads.length,
    aGrade:  leads.filter((l) => l.grade === "A").length,
    active:  activeLeads.length,
    opens:   leads.reduce((s, l) => s + (l.open_count ?? 0), 0),
    clicks:  leads.reduce((s, l) => s + (l.click_count ?? 0), 0),
    replied: leads.filter((l) => l.sequence_status === "replied" || l.response_received).length,
    emailed: leads.filter((l) => l.email).length,
  }), [leads, activeLeads]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const updateLead = useCallback(async (id: string, patch: Partial<RoofingLead>) => {
    setLeads((p) => p.map((l) => l.id === id ? { ...l, ...patch } : l));
    await supabase.from("roofing_leads").update(patch).eq("id", id);
  }, []);

  const sendStep = useCallback(async (lead: RoofingLead) => {
    if (!lead.email) return;
    const step = (lead.sequence_step ?? 0) + 1;
    const isComplete = step >= 3;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (step === 1 ? 3 : 2));
    nextDate.setHours(12, 0, 0, 0);
    const { subject, body } = buildEmail(lead, step);
    await updateLead(lead.id, {
      sequence_status: isComplete ? "completed" : "active",
      sequence_step: step,
      last_outreach_at: new Date().toISOString(),
      next_outreach_at: isComplete ? null : nextDate.toISOString(),
      outreach_sent: true,
    } as Partial<RoofingLead>);
    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  }, [updateLead]);

  const resetSequence = useCallback(async (lead: RoofingLead) => {
    await updateLead(lead.id, { sequence_status: "pending", sequence_step: 0, last_outreach_at: null, next_outreach_at: null, outreach_sent: false } as Partial<RoofingLead>);
  }, [updateLead]);

  const syncReplies = async () => {
    setSyncing(true);
    try { await fetch("/api/leads/sync-replies"); await loadLeads(); } catch { /* silent */ }
    finally { setSyncing(false); }
  };

  // Bulk actions
  const allSelected = sortedFiltered.length > 0 && sortedFiltered.every((l) => selected.has(l.id));
  const toggleAll  = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sortedFiltered.map((l) => l.id)));
  };
  const toggleRow = (id: string) => {
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const bulkReset = async () => {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => {
      const lead = leads.find((l) => l.id === id);
      if (lead) return resetSequence(lead);
    }));
    setSelected(new Set());
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[72, 480].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, backgroundColor: "#EAE4D8" }} />
      ))}
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 48, border: "1px solid #FDECEA", borderRadius: 12, backgroundColor: "#FFF8F8", color: "#C0392B" }}>
      <AlertCircle size={28} strokeWidth={1.5} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 600 }}>Connection Error</p>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{error}</p>
      </div>
      <button onClick={() => { setError(null); loadLeads(); }} style={{ padding: "7px 16px", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Retry</button>
    </div>
  );

  // Header columns config
  type ColDef = { label: string; key?: SortKey; align?: "left" | "center" | "right"; sticky?: boolean };
  const cols: ColDef[] = [
    { label: "Business",   key: "business_name", align: "left" },
    { label: "Grade",      align: "center" },
    { label: "Location",   key: "city", align: "center" },
    { label: "Sequence",   align: "center" },
    { label: "Last Touch", key: "last_outreach_at", align: "center" },
    { label: "Due",        key: "next_outreach_at", align: "center" },
    { label: "Opens",      key: "open_count", align: "center" },
    { label: "Clicks",     key: "open_count", align: "center" },
    { label: "Contact",    align: "left" },
    { label: "",           align: "right", sticky: true },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 30, color: "#1E1C1A", letterSpacing: "0.025em" }}>LEADS</h1>
          <p style={{ fontSize: 12.5, color: "#A09890", marginTop: 2 }}>
            {stats.total.toLocaleString()} scraped · {stats.aGrade} grade A · {stats.emailed} emailed · {stats.replied} replied
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 12, fontSize: 11, color: "#1E7A3C", backgroundColor: "#ECFBF0", padding: "2px 8px", borderRadius: 99 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#1E7A3C" }} />
              Live
            </span>
          </p>
        </div>
        <button onClick={syncReplies} disabled={syncing}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid #E8E2D8", borderRadius: 8, backgroundColor: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 500, color: "#6B6560", opacity: syncing ? 0.5 : 1 }}>
          <RefreshCw size={12} style={{ animation: syncing ? "spin 1s linear infinite" : undefined }} />
          {syncing ? "Syncing…" : "Sync Replies"}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
        <KpiCard icon={Users}              label="Total"      value={stats.total}   accent="#2C2A28" />
        <KpiCard icon={Zap}                label="A-Grade"    value={stats.aGrade}  accent="#FF6B2B" />
        <KpiCard icon={Send}               label="In Sequence" value={stats.active} accent="#1E5FAA" sub={`${stats.active} active`} />
        <KpiCard icon={MailOpen}           label="Opens"      value={stats.opens}   accent="#B86B10" />
        <KpiCard icon={MousePointerClick}  label="Clicks"     value={stats.clicks}  accent="#FF6B2B" />
        <KpiCard icon={MessageSquareCheck} label="Replied"    value={stats.replied} accent="#1E7A3C" />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Tabs */}
        <div style={{ display: "flex", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, padding: 3, gap: 2 }}>
          {([
            { key: "ready",  label: "Ready",  count: readyLeads.length },
            { key: "active", label: "Active", count: activeLeads.length },
            { key: "done",   label: "Done",   count: doneLeads.length },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelected(new Set()); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: tab === t.key ? 600 : 400, backgroundColor: tab === t.key ? "#FF6B2B" : "transparent", color: tab === t.key ? "#fff" : "#6B6560", transition: "all 0.15s" }}>
              {t.label}
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, backgroundColor: tab === t.key ? "rgba(255,255,255,0.3)" : "#F0EBE1", color: tab === t.key ? "#fff" : "#A09890", fontWeight: 600 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300 }}>
          <Search size={12} color="#A09890" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, city, email…"
            style={{ width: "100%", paddingLeft: 30, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #E8E2D8", borderRadius: 8, fontSize: 12.5, backgroundColor: "#fff", color: "#1E1C1A", outline: "none", fontFamily: "Inter, sans-serif" }} />
          {search && (
            <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A09890", display: "flex", padding: 2 }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Grade */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Filter size={11} color="#A09890" style={{ position: "absolute", left: 10, pointerEvents: "none" }} />
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
            style={{ appearance: "none", paddingLeft: 26, paddingRight: 26, paddingTop: 7, paddingBottom: 7, border: "1px solid #E8E2D8", borderRadius: 8, fontSize: 12.5, backgroundColor: "#fff", color: "#1E1C1A", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <option value="all">All Grades</option>
            <option value="A">A Only</option>
            <option value="B">B Only</option>
            <option value="C">C Only</option>
          </select>
          <ChevronDown size={11} color="#A09890" style={{ position: "absolute", right: 8, pointerEvents: "none" }} />
        </div>

        {/* State */}
        <div style={{ position: "relative" }}>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
            style={{ appearance: "none", padding: "7px 26px 7px 12px", border: "1px solid #E8E2D8", borderRadius: 8, fontSize: 12.5, backgroundColor: "#fff", color: "#1E1C1A", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <option value="all">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={11} color="#A09890" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", backgroundColor: "#FFF3EE", border: "1px solid #FFD5B8", borderRadius: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FF6B2B" }}>{selected.size} selected</span>
            <button onClick={bulkReset}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#FF6B2B", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
              <RotateCcw size={11} /> Reset Sequences
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ display: "flex", padding: 2, background: "none", border: "none", cursor: "pointer", color: "#A09890" }}>
              <X size={11} />
            </button>
          </div>
        )}

        {/* Clear filters */}
        {(search || gradeFilter !== "all" || stateFilter !== "all") && (
          <button onClick={() => { setSearch(""); setGradeFilter("all"); setStateFilter("all"); }}
            style={{ fontSize: 12, color: "#FF6B2B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginLeft: selected.size > 0 ? 0 : "auto" }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8E2D8", backgroundColor: "#F8F5F0" }}>
                {/* Checkbox */}
                <th style={{ width: 40, padding: "10px 8px 10px 16px", textAlign: "center" }}>
                  <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#A09890" }}>
                    {allSelected ? <CheckSquare size={14} color="#FF6B2B" /> : <Square size={14} />}
                  </button>
                </th>
                {cols.map((col) => (
                  <th key={col.label} onClick={() => col.key && toggleSort(col.key)}
                    style={{
                      padding: "10px 12px", textAlign: col.align ?? "left",
                      fontSize: 10, fontWeight: 600, color: col.key ? (sortKey === col.key ? "#FF6B2B" : "#8C8070") : "#8C8070",
                      textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap",
                      cursor: col.key ? "pointer" : "default", userSelect: "none",
                      ...(col.sticky ? { position: "sticky", right: 0, backgroundColor: "#F8F5F0", boxShadow: "-6px 0 10px -4px rgba(0,0,0,0.06)" } : {}),
                    }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {col.key && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.length === 0 ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: "56px 0", textAlign: "center", color: "#A09890", fontSize: 13 }}>
                  No leads match your filters.
                </td></tr>
              ) : sortedFiltered.map((lead) => {
                const isSelected = selected.has(lead.id);
                const due = dueLabel(lead.next_outreach_at);
                const gs = GRADE_STYLE[lead.grade] ?? GRADE_STYLE.C;
                const step = lead.sequence_step ?? 0;

                return (
                  <tr key={lead.id}
                    style={{ borderBottom: "1px solid #F5F0E8", backgroundColor: isSelected ? "#FFF8F5" : "transparent", transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAF8"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "#FFF8F5" : "transparent"; }}>

                    {/* Checkbox */}
                    <td style={{ padding: "10px 8px 10px 16px", textAlign: "center" }}>
                      <button onClick={() => toggleRow(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#A09890" }}>
                        {isSelected ? <CheckSquare size={14} color="#FF6B2B" /> : <Square size={14} />}
                      </button>
                    </td>

                    {/* Business */}
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 200 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1E1C1A", display: "flex", alignItems: "center", gap: 4 }}>
                          {lead.business_name ?? "—"}
                          {lead.grade === "A" && <Zap size={10} color="#FF6B2B" fill="#FF6B2B" />}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#A09890", display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Globe size={9} />
                          {lead.website_url ? lead.website_url.replace(/https?:\/\//, "").replace(/\/$/, "").substring(0, 28) : <em>No website</em>}
                        </span>
                      </div>
                    </td>

                    {/* Grade */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      <span style={{ ...gs, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 700 }}>
                        {lead.grade}
                      </span>
                    </td>

                    {/* Location */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: "#6B6560" }}>
                        {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>

                    {/* Sequence */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {lead.sequence_status === "replied" || lead.response_received ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6, backgroundColor: "#ECFBF0", color: "#1E7A3C" }}>
                          <MessageSquareCheck size={9} /> Replied
                        </span>
                      ) : lead.sequence_status === "active" ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: "#1E5FAA" }}>Step {step}/3</span>
                          <SequenceBar step={step} />
                        </div>
                      ) : lead.sequence_status === "completed" ? (
                        <span style={{ fontSize: 10.5, fontWeight: 500, color: "#A09890" }}>Completed</span>
                      ) : lead.sequence_status === "pending" ? (
                        <span style={{ fontSize: 10.5, fontWeight: 500, color: "#C8C0B8" }}>Queued</span>
                      ) : (
                        <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: lead.brand_primary_color ?? "#E8E2D8", margin: "0 auto", border: "1px solid #D4CCBC" }} />
                      )}
                    </td>

                    {/* Last Touch */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 11.5, color: "#A09890", fontFamily: "JetBrains Mono, monospace" }}>
                        {timeAgo(lead.last_outreach_at)}
                      </span>
                    </td>

                    {/* Due */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {due ? (
                        <span style={{ ...due.style, display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, letterSpacing: "0.04em" }}>
                          {due.label}
                        </span>
                      ) : <span style={{ color: "#D4CCBC", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Opens */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {(lead.open_count ?? 0) > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#B86B10" }}>
                          <MailOpen size={10} /> {lead.open_count}
                        </span>
                      ) : <span style={{ color: "#D4CCBC", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Clicks */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {(lead.click_count ?? 0) > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#FF6B2B" }}>
                          <MousePointerClick size={10} /> {lead.click_count}
                        </span>
                      ) : <span style={{ color: "#D4CCBC", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11.5, color: lead.email ? "#3D342A" : "#C8C0B8", fontStyle: lead.email ? "normal" : "italic", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.email ?? "No email"}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#A09890", display: "flex", alignItems: "center", gap: 3 }}>
                          {lead.phone ? <><Phone size={9} />{lead.phone}</> : "No phone"}
                        </span>
                      </div>
                    </td>

                    {/* Actions — sticky */}
                    <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap", position: "sticky", right: 0, backgroundColor: isSelected ? "#FFF8F5" : "#fff", boxShadow: "-6px 0 10px -4px rgba(0,0,0,0.05)", transition: "background-color 0.1s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>

                        {lead.website_url && (
                          <a href={lead.website_url} target="_blank" rel="noreferrer" title="Visit website"
                            style={{ display: "flex", padding: 5, borderRadius: 6, color: "#C8C0B8", transition: "all 0.1s", border: "1px solid transparent" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"; (e.currentTarget as HTMLElement).style.color = "#6B6560"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "#C8C0B8"; }}>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {lead.slug && (
                          <a href={`https://app.woodfireddesigns.com/roofing/${lead.slug}`} target="_blank" rel="noreferrer" title="View preview"
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", fontSize: 11.5, fontWeight: 500, color: "#6B6560", border: "1px solid #E8E2D8", borderRadius: 6, backgroundColor: "#F8F5F0", textDecoration: "none", transition: "all 0.1s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D4CCBC"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"; }}>
                            <Eye size={10} /> Preview
                          </a>
                        )}

                        {/* Context menu */}
                        <div style={{ position: "relative" }}>
                          <button onClick={() => setActionMenu(actionMenu === lead.id ? null : lead.id)}
                            style={{ display: "flex", padding: 5, borderRadius: 6, color: "#C8C0B8", background: "none", border: "1px solid transparent", cursor: "pointer", transition: "all 0.1s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"; (e.currentTarget as HTMLElement).style.color = "#6B6560"; }}
                            onMouseLeave={(e) => { if (actionMenu !== lead.id) { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "#C8C0B8"; } }}>
                            <MoreHorizontal size={12} />
                          </button>
                          {actionMenu === lead.id && (
                            <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: 160, overflow: "hidden" }}
                              onMouseLeave={() => setActionMenu(null)}>
                              {lead.sequence_status === "active" && (
                                <button onClick={() => { resetSequence(lead); setActionMenu(null); }}
                                  style={{ width: "100%", textAlign: "left", padding: "8px 14px", fontSize: 12.5, color: "#6B6560", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter, sans-serif" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F5F0")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <RotateCcw size={11} /> Reset sequence
                                </button>
                              )}
                              {lead.email && (
                                <a href={`mailto:${lead.email}`}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", fontSize: 12.5, color: "#6B6560", textDecoration: "none", transition: "background-color 0.1s" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F5F0")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <Mail size={11} /> Email directly
                                </a>
                              )}
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", fontSize: 12.5, color: "#6B6560", textDecoration: "none", transition: "background-color 0.1s" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F5F0")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <Phone size={11} /> Call
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Primary CTA */}
                        {(!lead.sequence_status || lead.sequence_status === "none" || lead.sequence_status === "pending") ? (
                          <button onClick={() => sendStep(lead)} disabled={!lead.email || !lead.slug}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 12, fontWeight: 600, backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 6, cursor: (!lead.email || !lead.slug) ? "not-allowed" : "pointer", opacity: (!lead.email || !lead.slug) ? 0.3 : 1, transition: "opacity 0.1s" }}
                            onMouseEnter={(e) => { if (lead.email && lead.slug) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = (!lead.email || !lead.slug) ? "0.3" : "1"; }}>
                            <Zap size={10} /> Send 1
                          </button>
                        ) : lead.sequence_status === "active" && step < 3 ? (
                          <button onClick={() => sendStep(lead)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 12, fontWeight: 600, backgroundColor: "#1E5FAA", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                            <Mail size={10} /> Send {step + 1}
                          </button>
                        ) : null}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div style={{ padding: "9px 16px", borderTop: "1px solid #F0EBE1", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FAFAF8" }}>
          <span style={{ fontSize: 11, color: "#A09890" }}>
            Showing {sortedFiltered.length.toLocaleString()} of {tabLeads.length.toLocaleString()} leads
          </span>
          {selected.size > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#FF6B2B" }}>{selected.size} selected</span>
          )}
        </div>
      </div>

    </div>
  );
}
