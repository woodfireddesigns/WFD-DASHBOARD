"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  ExternalLink, Eye, Mail, Zap, Globe, Phone, RefreshCw,
  MousePointerClick, MailOpen, MessageSquareCheck, Users,
  TrendingUp, AlertCircle, Search, X, ChevronDown, ChevronUp,
  ChevronsUpDown, CheckSquare, Square, MoreHorizontal, RotateCcw,
  Filter,
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

type SortKey = "score" | "business_name" | "city" | "open_count" | "click_count" | "next_outreach_at" | "last_outreach_at" | "grade";
type SortDir = "asc" | "desc";
type Tab = "all" | "ready" | "active" | "done";
type GradeFilter = "all" | "A" | "B" | "C";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function dueLabel(iso: string | null): { label: string; bg: string; color: string } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (ms <= 0)   return { label: "Due Now", bg: "#FDECEA", color: "#C0392B" };
  if (hrs < 24)  return { label: `${hrs}h`,  bg: "#FEF3E2", color: "#B86B10" };
  return { label: `${days}d`, bg: "#F0EBE1", color: "#A09890" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  A: { bg: "#ECFBF0", color: "#1E7A3C" },
  B: { bg: "#EEF4FF", color: "#1E5FAA" },
  C: { bg: "#F0EBE1", color: "#6B6560" },
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={10} color="#C8C0B8" />;
  return dir === "asc" ? <ChevronUp size={10} color="#FF6B2B" /> : <ChevronDown size={10} color="#FF6B2B" />;
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent: string }) {
  return (
    <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${accent}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={accent} strokeWidth={1.75} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1E1C1A", lineHeight: 1, fontFamily: "Anton, sans-serif", letterSpacing: "0.025em" }}>
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads]             = useState<RoofingLead[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [syncing, setSyncing]         = useState(false);
  const [tab, setTab]                 = useState<Tab>("all");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [emailOnly, setEmailOnly]     = useState(false);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState<SortKey>("score");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [actionMenu, setActionMenu]   = useState<string | null>(null);
  const [sending, setSending]         = useState<Set<string>>(new Set());
  const [sendingAll, setSendingAll]     = useState(false);
  const [sendingTop5, setSendingTop5]   = useState(false);
  const [sendAllResult, setSendAllResult] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { leads: data, error: err } = await res.json();
      if (err) throw new Error(err);
      setLeads(data as RoofingLead[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await loadLeads(); setLoading(false); })();
  }, [loadLeads]);

  // Real-time subscription for live row updates
  useEffect(() => {
    const ch = supabase
      .channel("roofing_leads_rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "roofing_leads" }, (payload) => {
        setLeads((p) => p.map((l) => l.id === (payload.new as RoofingLead).id ? { ...l, ...(payload.new as RoofingLead) } : l));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "roofing_leads" }, (payload) => {
        setLeads((p) => [payload.new as RoofingLead, ...p]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const states = useMemo(() => {
    const s = new Set(leads.map((l) => l.state).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [leads]);

  const tabLeads = useMemo(() => {
    if (tab === "ready")  return leads.filter((l) => !l.sequence_status || l.sequence_status === "none" || l.sequence_status === "pending");
    if (tab === "active") return leads.filter((l) => l.sequence_status === "active" || l.sequence_status === "replied");
    if (tab === "done")   return leads.filter((l) => l.sequence_status === "completed");
    return leads;
  }, [leads, tab]);

  const tabCounts = useMemo(() => ({
    all:    leads.length,
    ready:  leads.filter((l) => !l.sequence_status || l.sequence_status === "none" || l.sequence_status === "pending").length,
    active: leads.filter((l) => l.sequence_status === "active" || l.sequence_status === "replied").length,
    done:   leads.filter((l) => l.sequence_status === "completed").length,
  }), [leads]);

  const filtered = useMemo(() => {
    let list = [...tabLeads];
    if (gradeFilter !== "all") list = list.filter((l) => l.grade === gradeFilter);
    if (stateFilter !== "all") list = list.filter((l) => l.state === stateFilter);
    if (emailOnly) list = list.filter((l) => !!l.email);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        (l.business_name ?? "").toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.state ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number | null;
      let bv: string | number | null;
      if (sortKey === "next_outreach_at" || sortKey === "last_outreach_at") {
        av = a[sortKey] ? new Date(a[sortKey]!).getTime() : (sortDir === "asc" ? Infinity : -Infinity);
        bv = b[sortKey] ? new Date(b[sortKey]!).getTime() : (sortDir === "asc" ? Infinity : -Infinity);
      } else if (sortKey === "grade") {
        const order: Record<string, number> = { A: 1, B: 2, C: 3, ungraded: 4 };
        av = order[a.grade] ?? 5;
        bv = order[b.grade] ?? 5;
      } else {
        av = a[sortKey] as string | number | null;
        bv = b[sortKey] as string | number | null;
      }
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [tabLeads, gradeFilter, stateFilter, emailOnly, search, sortKey, sortDir]);

  // Pin overdue to top in active tab
  const displayLeads = useMemo(() => {
    if (tab !== "active") return filtered;
    return [...filtered].sort((a, b) => {
      const aOvr = a.next_outreach_at ? new Date(a.next_outreach_at).getTime() <= Date.now() : false;
      const bOvr = b.next_outreach_at ? new Date(b.next_outreach_at).getTime() <= Date.now() : false;
      if (aOvr && !bOvr) return -1;
      if (!aOvr && bOvr) return 1;
      return 0;
    });
  }, [filtered, tab]);

  const stats = useMemo(() => ({
    total:    leads.length,
    aGrade:   leads.filter((l) => l.grade === "A").length,
    withEmail: leads.filter((l) => l.email).length,
    active:   leads.filter((l) => l.sequence_status === "active").length,
    opens:    leads.reduce((s, l) => s + (l.open_count ?? 0), 0),
    clicks:   leads.reduce((s, l) => s + (l.click_count ?? 0), 0),
    replied:  leads.filter((l) => l.sequence_status === "replied" || l.response_received).length,
  }), [leads]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const updateLead = useCallback(async (id: string, patch: Partial<RoofingLead>) => {
    setLeads((p) => p.map((l) => l.id === id ? { ...l, ...patch } : l));
    await supabase.from("roofing_leads").update(patch).eq("id", id);
  }, []);

  const sendStep = useCallback(async (lead: RoofingLead) => {
    if (!lead.email || !lead.slug) return;
    setSending((p) => new Set(p).add(lead.id));
    try {
      const res = await fetch("/api/leads/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      if (!res.ok) {
        const { error: err } = await res.json();
        alert(`Send failed: ${err}`);
      }
    } finally {
      setSending((p) => { const n = new Set(p); n.delete(lead.id); return n; });
    }
  }, []);

  const resetSequence = useCallback(async (lead: RoofingLead) => {
    await updateLead(lead.id, {
      sequence_status: null,
      sequence_step: 0,
      last_outreach_at: null,
      next_outreach_at: null,
    } as Partial<RoofingLead>);
  }, [updateLead]);

  const sendAllDue = async () => {
    const now = new Date();
    const due = leads.filter(l => {
      if (!l.email || !l.slug) return false;
      if (!l.sequence_status || l.sequence_status === "none") return true; // never sent
      if (l.sequence_status === "active" && (l.sequence_step ?? 0) < 3) {
        if (!l.next_outreach_at) return false;
        return new Date(l.next_outreach_at) <= now;
      }
      return false;
    });
    if (due.length === 0) { setSendAllResult("No leads due today."); return; }
    setSendingAll(true);
    setSendAllResult(null);
    let sent = 0;
    for (const lead of due) {
      try { const r = await fetch("/api/leads/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) }); if (r.ok) sent++; } catch { /* continue */ }
    }
    await loadLeads();
    setSendingAll(false);
    setSendAllResult(`Sent ${sent} of ${due.length} emails.`);
    setTimeout(() => setSendAllResult(null), 5000);
  };

  const sendTop5 = async () => {
    // Top 5 unsent leads by score that have both email and slug
    const unsent = leads
      .filter((l) => l.email && l.slug && (!l.sequence_status || l.sequence_status === "none" || l.sequence_status === "pending"))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
    if (unsent.length === 0) { setSendAllResult("No unsent leads with email + preview found."); return; }
    setSendingTop5(true);
    setSendAllResult(null);
    let sent = 0;
    for (const lead of unsent) {
      try {
        const r = await fetch("/api/leads/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
        if (r.ok) sent++;
        // Small delay between sends to look human
        await new Promise((res) => setTimeout(res, 1500));
      } catch { /* continue */ }
    }
    await loadLeads();
    setSendingTop5(false);
    setSendAllResult(`Sent ${sent} of ${unsent.length} emails.`);
    setTimeout(() => setSendAllResult(null), 6000);
  };

  const syncReplies = async () => {
    setSyncing(true);
    try { await fetch("/api/leads/sync-replies"); await loadLeads(); } catch { /* silent */ }
    finally { setSyncing(false); }
  };

  const allSelected = displayLeads.length > 0 && displayLeads.every((l) => selected.has(l.id));
  const toggleAll  = () => allSelected ? setSelected(new Set()) : setSelected(new Set(displayLeads.map((l) => l.id)));
  const toggleRow  = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulkReset = async () => {
    await Promise.all(Array.from(selected).map((id) => {
      const lead = leads.find((l) => l.id === id);
      return lead ? resetSequence(lead) : Promise.resolve();
    }));
    setSelected(new Set());
  };

  const clearFilters = () => { setSearch(""); setGradeFilter("all"); setStateFilter("all"); setEmailOnly(false); };
  const hasFilters = search || gradeFilter !== "all" || stateFilter !== "all" || emailOnly;

  // ── Columns ──────────────────────────────────────────────────────────────────

  type Col = { label: string; key?: SortKey; align?: "left" | "center" | "right"; sticky?: boolean; width?: number };
  const cols: Col[] = [
    { label: "Business",   key: "business_name",    align: "left",    width: 220 },
    { label: "Grade",      key: "grade",             align: "center",  width: 64 },
    { label: "Location",   key: "city",              align: "left",    width: 140 },
    { label: "Sequence",   align: "center",          width: 110 },
    { label: "Last Touch", key: "last_outreach_at",  align: "center",  width: 100 },
    { label: "Due",        key: "next_outreach_at",  align: "center",  width: 72 },
    { label: "Opens",      key: "open_count",        align: "center",  width: 64 },
    { label: "Clicks",     key: "click_count",       align: "center",  width: 64 },
    { label: "Contact",    align: "left",            width: 180 },
    { label: "",           align: "right",           sticky: true,     width: 200 },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ height: 68, borderRadius: 12, backgroundColor: "#EAE4D8" }} />)}
      </div>
      <div style={{ height: 500, borderRadius: 12, backgroundColor: "#EAE4D8" }} />
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 48, border: "1px solid #FDECEA", borderRadius: 12, backgroundColor: "#FFF8F8", color: "#C0392B" }}>
      <AlertCircle size={28} strokeWidth={1.5} />
      <p style={{ fontWeight: 600 }}>Error loading leads</p>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{error}</p>
      <button onClick={() => { setError(null); loadLeads(); }} style={{ padding: "7px 16px", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 30, color: "#1E1C1A", letterSpacing: "0.025em" }}>LEADS</h1>
          <p style={{ fontSize: 12.5, color: "#A09890", marginTop: 2 }}>
            {stats.total.toLocaleString()} total · {stats.aGrade} grade A · {stats.withEmail} with email · {stats.replied} replied
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {sendAllResult && (
            <span style={{ fontSize: 12, color: "#1E7A3C", backgroundColor: "#ECFBF0", padding: "5px 10px", borderRadius: 6, fontWeight: 500 }}>
              {sendAllResult}
            </span>
          )}
          <button onClick={sendTop5} disabled={sendingTop5 || sendingAll}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid #FF6B2B", borderRadius: 8, backgroundColor: sendingTop5 ? "#FFF3EE" : "#fff", cursor: (sendingTop5 || sendingAll) ? "not-allowed" : "pointer", fontSize: 12.5, fontWeight: 600, color: sendingTop5 ? "#A09890" : "#FF6B2B", opacity: (sendingTop5 || sendingAll) ? 0.7 : 1, transition: "all 0.15s" }}
            onMouseEnter={(e) => { if (!sendingTop5 && !sendingAll) (e.currentTarget as HTMLElement).style.backgroundColor = "#FFF3EE"; }}
            onMouseLeave={(e) => { if (!sendingTop5 && !sendingAll) (e.currentTarget as HTMLElement).style.backgroundColor = "#fff"; }}>
            <Zap size={12} />
            {sendingTop5 ? "Sending…" : "Send Top 5"}
          </button>
          <button onClick={sendAllDue} disabled={sendingAll || sendingTop5}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, backgroundColor: sendingAll ? "#F0EBE1" : "#FF6B2B", cursor: (sendingAll || sendingTop5) ? "not-allowed" : "pointer", fontSize: 12.5, fontWeight: 600, color: sendingAll ? "#A09890" : "#fff", opacity: (sendingAll || sendingTop5) ? 0.7 : 1 }}>
            <Mail size={12} />
            {sendingAll ? "Sending…" : "Send All Due"}
          </button>
          <button onClick={syncReplies} disabled={syncing}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid #E8E2D8", borderRadius: 8, backgroundColor: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 500, color: "#6B6560", opacity: syncing ? 0.5 : 1 }}>
            <RefreshCw size={12} style={{ animation: syncing ? "spin 1s linear infinite" : undefined }} />
            {syncing ? "Syncing…" : "Sync Replies"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
        <KpiCard icon={Users}              label="Total"       value={stats.total}     accent="#2C2A28" />
        <KpiCard icon={Zap}                label="Grade A"     value={stats.aGrade}    accent="#FF6B2B" />
        <KpiCard icon={Mail}               label="Have Email"  value={stats.withEmail} accent="#1E5FAA" />
        <KpiCard icon={TrendingUp}         label="In Sequence" value={stats.active}    accent="#B86B10" />
        <KpiCard icon={MailOpen}           label="Opens"       value={stats.opens}     accent="#9333EA" />
        <KpiCard icon={MessageSquareCheck} label="Replied"     value={stats.replied}   accent="#1E7A3C" />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

        {/* Tabs */}
        <div style={{ display: "flex", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["all", "ready", "active", "done"] as Tab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSelected(new Set()); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: tab === t ? 600 : 400, backgroundColor: tab === t ? "#FF6B2B" : "transparent", color: tab === t ? "#fff" : "#6B6560", transition: "all 0.15s", textTransform: "capitalize" }}>
              {t}
              <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 99, backgroundColor: tab === t ? "rgba(255,255,255,0.3)" : "#F0EBE1", color: tab === t ? "#fff" : "#A09890", fontWeight: 600 }}>
                {tabCounts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 280 }}>
          <Search size={12} color="#A09890" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, city, email…"
            style={{ width: "100%", paddingLeft: 30, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #E8E2D8", borderRadius: 8, fontSize: 12.5, backgroundColor: "#fff", color: "#1E1C1A", outline: "none", fontFamily: "Inter, sans-serif" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A09890", display: "flex" }}><X size={11} /></button>}
        </div>

        {/* Grade */}
        <div style={{ position: "relative" }}>
          <Filter size={11} color="#A09890" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
            style={{ appearance: "none", paddingLeft: 26, paddingRight: 24, paddingTop: 7, paddingBottom: 7, border: "1px solid #E8E2D8", borderRadius: 8, fontSize: 12.5, backgroundColor: "#fff", color: "#1E1C1A", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <option value="all">All Grades</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
          <ChevronDown size={11} color="#A09890" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        {/* State */}
        <div style={{ position: "relative" }}>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
            style={{ appearance: "none", padding: "7px 24px 7px 10px", border: "1px solid #E8E2D8", borderRadius: 8, fontSize: 12.5, backgroundColor: "#fff", color: "#1E1C1A", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <option value="all">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={11} color="#A09890" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        {/* Has Email toggle */}
        <button onClick={() => setEmailOnly((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: `1px solid ${emailOnly ? "#FF6B2B" : "#E8E2D8"}`, borderRadius: 8, backgroundColor: emailOnly ? "#FFF3EE" : "#fff", color: emailOnly ? "#FF6B2B" : "#6B6560", fontSize: 12.5, fontWeight: emailOnly ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
          <Mail size={11} /> Has Email
        </button>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", backgroundColor: "#FFF3EE", border: "1px solid #FFD5B8", borderRadius: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FF6B2B" }}>{selected.size} selected</span>
            <button onClick={bulkReset} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#FF6B2B", background: "none", border: "none", cursor: "pointer" }}>
              <RotateCcw size={11} /> Reset
            </button>
            <button onClick={() => setSelected(new Set())} style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: "#A09890" }}><X size={11} /></button>
          </div>
        )}

        {hasFilters && (
          <button onClick={clearFilters} style={{ fontSize: 12, color: "#FF6B2B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginLeft: "auto" }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 1120 }}>
            <colgroup>
              <col style={{ width: 44 }} />
              {cols.map((c, i) => <col key={i} style={{ width: c.width }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8E2D8", backgroundColor: "#F8F5F0" }}>
                <th style={{ padding: "10px 8px 10px 14px", textAlign: "center" }}>
                  <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#A09890" }}>
                    {allSelected ? <CheckSquare size={14} color="#FF6B2B" /> : <Square size={14} />}
                  </button>
                </th>
                {cols.map((col) => (
                  <th key={col.label} onClick={() => col.key && toggleSort(col.key)}
                    style={{
                      padding: "10px 12px", textAlign: col.align ?? "left",
                      fontSize: 10, fontWeight: 600,
                      color: col.key && sortKey === col.key ? "#FF6B2B" : "#8C8070",
                      textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap",
                      cursor: col.key ? "pointer" : "default", userSelect: "none",
                      ...(col.sticky ? { position: "sticky", right: 0, backgroundColor: "#F8F5F0", boxShadow: "-6px 0 10px -4px rgba(0,0,0,0.06)" } : {}),
                    }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {col.key && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayLeads.length === 0 ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: "56px 0", textAlign: "center", color: "#A09890", fontSize: 13 }}>
                  No leads match your filters.
                  {hasFilters && <button onClick={clearFilters} style={{ marginLeft: 8, color: "#FF6B2B", background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Clear</button>}
                </td></tr>
              ) : displayLeads.map((lead) => {
                const isSelected = selected.has(lead.id);
                const due = dueLabel(lead.next_outreach_at);
                const gs = GRADE_STYLE[lead.grade] ?? GRADE_STYLE.C;
                const step = lead.sequence_step ?? 0;
                const isSending = sending.has(lead.id);
                const canSend = !!lead.email && !!lead.slug;

                return (
                  <tr key={lead.id}
                    style={{ borderBottom: "1px solid #F5F0E8", backgroundColor: isSelected ? "#FFF8F5" : "transparent", transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAF8"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "#FFF8F5" : "transparent"; }}>

                    {/* Checkbox */}
                    <td style={{ padding: "10px 8px 10px 14px", textAlign: "center" }}>
                      <button onClick={() => toggleRow(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#A09890" }}>
                        {isSelected ? <CheckSquare size={14} color="#FF6B2B" /> : <Square size={14} />}
                      </button>
                    </td>

                    {/* Business */}
                    <td style={{ padding: "11px 12px", overflow: "hidden" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1E1C1A", display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.business_name ?? "—"}
                          {lead.grade === "A" && <Zap size={10} color="#FF6B2B" fill="#FF6B2B" style={{ flexShrink: 0 }} />}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#A09890", display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Globe size={9} style={{ flexShrink: 0 }} />
                          {lead.website_url ? lead.website_url.replace(/https?:\/\//, "").replace(/\/$/, "") : <em>No website</em>}
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
                    <td style={{ padding: "11px 12px", overflow: "hidden" }}>
                      <span style={{ fontSize: 12, color: "#6B6560", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>

                    {/* Sequence */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {lead.sequence_status === "replied" || lead.response_received ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "3px 7px", borderRadius: 6, backgroundColor: "#ECFBF0", color: "#1E7A3C" }}>
                          <MessageSquareCheck size={9} /> Replied
                        </span>
                      ) : lead.sequence_status === "active" ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: "#1E5FAA" }}>Step {step}/3</span>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1,2,3].map((i) => <div key={i} style={{ width: 16, height: 2, borderRadius: 2, backgroundColor: i <= step ? "#1E5FAA" : "#E8E2D8" }} />)}
                          </div>
                        </div>
                      ) : lead.sequence_status === "completed" ? (
                        <span style={{ fontSize: 10.5, color: "#A09890", fontWeight: 500 }}>Done</span>
                      ) : (
                        <span style={{ fontSize: 10.5, color: "#C8C0B8" }}>—</span>
                      )}
                    </td>

                    {/* Last Touch */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: "#A09890", fontFamily: "JetBrains Mono, monospace" }}>
                        {timeAgo(lead.last_outreach_at)}
                      </span>
                    </td>

                    {/* Due */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {due ? (
                        <span style={{ backgroundColor: due.bg, color: due.color, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>{due.label}</span>
                      ) : <span style={{ color: "#D4CCBC" }}>—</span>}
                    </td>

                    {/* Opens */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {(lead.open_count ?? 0) > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#9333EA" }}>
                          <MailOpen size={10} /> {lead.open_count}
                        </span>
                      ) : <span style={{ color: "#D4CCBC" }}>—</span>}
                    </td>

                    {/* Clicks */}
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {(lead.click_count ?? 0) > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#FF6B2B" }}>
                          <MousePointerClick size={10} /> {lead.click_count}
                        </span>
                      ) : <span style={{ color: "#D4CCBC" }}>—</span>}
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "11px 12px", overflow: "hidden" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11.5, color: lead.email ? "#3D342A" : "#C8C0B8", fontStyle: lead.email ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.email ?? "No email"}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#A09890", display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.phone ? <><Phone size={9} style={{ flexShrink: 0 }} />{lead.phone}</> : "No phone"}
                        </span>
                      </div>
                    </td>

                    {/* Actions — sticky */}
                    <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap", position: "sticky", right: 0, backgroundColor: isSelected ? "#FFF8F5" : "#fff", boxShadow: "-6px 0 10px -4px rgba(0,0,0,0.05)", transition: "background-color 0.1s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>

                        {lead.website_url && (
                          <a href={lead.website_url} target="_blank" rel="noreferrer"
                            style={{ display: "flex", padding: 5, borderRadius: 6, color: "#C8C0B8", border: "1px solid transparent", transition: "all 0.1s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"; (e.currentTarget as HTMLElement).style.color = "#6B6560"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "#C8C0B8"; }}>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {lead.slug && (
                          <a href={`https://roofer-preview-site.vercel.app/roofing/${lead.slug}`} target="_blank" rel="noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", fontSize: 11.5, fontWeight: 500, color: "#6B6560", border: "1px solid #E8E2D8", borderRadius: 6, backgroundColor: "#F8F5F0", textDecoration: "none", transition: "all 0.1s" }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "#D4CCBC"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"}>
                            <Eye size={10} /> Preview
                          </a>
                        )}

                        {/* Context menu */}
                        <div style={{ position: "relative" }}>
                          <button onClick={() => setActionMenu(actionMenu === lead.id ? null : lead.id)}
                            style={{ display: "flex", padding: 5, borderRadius: 6, color: "#C8C0B8", background: "none", border: "1px solid transparent", cursor: "pointer" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"; (e.currentTarget as HTMLElement).style.color = "#6B6560"; }}
                            onMouseLeave={(e) => { if (actionMenu !== lead.id) { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "#C8C0B8"; } }}>
                            <MoreHorizontal size={12} />
                          </button>
                          {actionMenu === lead.id && (
                            <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: 152, overflow: "hidden" }}
                              onMouseLeave={() => setActionMenu(null)}>
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12.5, color: "#6B6560", textDecoration: "none" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F5F0")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <Mail size={11} /> Email directly
                                </a>
                              )}
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12.5, color: "#6B6560", textDecoration: "none" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F5F0")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <Phone size={11} /> Call
                                </a>
                              )}
                              {(lead.sequence_status === "active" || lead.sequence_status === "completed") && (
                                <button onClick={() => { resetSequence(lead); setActionMenu(null); }}
                                  style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12.5, color: "#C0392B", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF8F8")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <RotateCcw size={11} /> Reset sequence
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Primary CTA */}
                        {(!lead.sequence_status || lead.sequence_status === "none" || !lead.sequence_status) && (
                          <button onClick={() => canSend && !isSending && sendStep(lead)}
                            disabled={!canSend || isSending}
                            title={!lead.email ? "No email" : !lead.slug ? "No preview yet" : undefined}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", fontSize: 12, fontWeight: 600, backgroundColor: canSend ? "#FF6B2B" : "#2A241E", color: canSend ? "#fff" : "#5A4E46", border: `1px solid ${canSend ? "transparent" : "#3D342C"}`, borderRadius: 6, cursor: canSend && !isSending ? "pointer" : "not-allowed", minWidth: 66, justifyContent: "center", transition: "opacity 0.1s" }}>
                            {isSending ? "…" : <><Zap size={10} /> Send 1</>}
                          </button>
                        )}
                        {lead.sequence_status === "active" && step < 3 && (
                          <button onClick={() => !isSending && sendStep(lead)} disabled={isSending}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", fontSize: 12, fontWeight: 600, backgroundColor: "#1E5FAA", color: "#fff", border: "none", borderRadius: 6, cursor: isSending ? "not-allowed" : "pointer", minWidth: 66, justifyContent: "center" }}>
                            {isSending ? "…" : <><Mail size={10} /> Send {step + 1}</>}
                          </button>
                        )}
                        {lead.sequence_status === "replied" && (
                          <span style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, backgroundColor: "#ECFBF0", color: "#1E7A3C", fontWeight: 600 }}>Replied</span>
                        )}
                        {lead.sequence_status === "completed" && (
                          <span style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, backgroundColor: "#F0EBE1", color: "#A09890", fontWeight: 600 }}>Done</span>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "9px 16px", borderTop: "1px solid #F0EBE1", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FAFAF8" }}>
          <span style={{ fontSize: 11, color: "#A09890" }}>
            Showing {displayLeads.length.toLocaleString()} of {tabLeads.length.toLocaleString()} leads
          </span>
          {selected.size > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#FF6B2B" }}>{selected.size} selected</span>}
        </div>
      </div>

    </div>
  );
}
