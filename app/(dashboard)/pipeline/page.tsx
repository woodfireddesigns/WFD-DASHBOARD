"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase, TradesLead, InboundLead, TradesStage, InboundStage } from "@/lib/supabase";
import { MapPin, Mail, RefreshCw, Plus, X, ChevronDown, Loader2, Pencil } from "lucide-react";

// ── Stage configs ─────────────────────────────────────────────────────────────

const TRADES_STAGES: { id: TradesStage; label: string; color: string }[] = [
  { id: "scraped",         label: "Scraped",       color: "#A09890" },
  { id: "outreach_active", label: "In Sequence",   color: "#1E5FAA" },
  { id: "responded",       label: "Responded",     color: "#B86B10" },
  { id: "call_booked",     label: "Call Booked",   color: "#FF6B2B" },
  { id: "proposal_sent",   label: "Proposal Sent", color: "#1E1C1A" },
  { id: "closed_won",      label: "Closed",        color: "#1E7A3C" },
];

const INBOUND_STAGES: { id: InboundStage; label: string; color: string }[] = [
  { id: "new",           label: "New",           color: "#A09890" },
  { id: "qualified",     label: "Qualified",     color: "#B86B10" },
  { id: "proposal_sent", label: "Proposal Sent", color: "#1E1C1A" },
  { id: "closed_won",    label: "Closed",        color: "#1E7A3C" },
];

const GRADE_BG: Record<string, { bg: string; color: string }> = {
  A:        { bg: "#ECFBF0", color: "#1E7A3C" },
  B:        { bg: "#FEF3E2", color: "#B86B10" },
  C:        { bg: "#F0EBE1", color: "#6B6560" },
  ungraded: { bg: "#F0EBE1", color: "#A09890" },
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const S = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #E8E2D8",
    borderRadius: 10,
    padding: "12px 14px",
  } as React.CSSProperties,
  pill: (bg: string, color: string): React.CSSProperties => ({
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 99,
    backgroundColor: bg,
    color,
  }),
};

// ── Shared fixed dropdown ─────────────────────────────────────────────────────

function MoveDropdown({ btnRef, open, stages, onSelect }: {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  stages: { id: string; label: string; color: string }[];
  onSelect: (id: string) => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }, [open, btnRef]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      style={{
        position: "fixed", top: pos.top, left: pos.left, width: pos.width,
        zIndex: 9999, backgroundColor: "#fff", border: "1px solid #E8E2D8",
        borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
      }}
    >
      {stages.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            width: "100%", textAlign: "left", padding: "8px 12px",
            fontSize: 12, color: s.color, background: "none", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            transition: "background-color 0.1s", fontFamily: "Inter, system-ui, sans-serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F5F0")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <span style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: s.color, flexShrink: 0 }} />
          {s.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Trades card ───────────────────────────────────────────────────────────────

function TradesCard({ lead, stages, onMove, onDragStart, onEdited }: {
  lead: TradesLead;
  stages: typeof TRADES_STAGES;
  onMove: (id: string, s: TradesStage) => void;
  onDragStart: (id: string, type: "trades") => void;
  onEdited: (updated: TradesLead) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const g = GRADE_BG[lead.grade] ?? GRADE_BG.ungraded;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    setTimeout(() => document.addEventListener("click", close), 0);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(lead.id, "trades"); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...S.card, cursor: "grab" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: "#1E1C1A", lineHeight: 1.3 }}>{lead.business_name ?? "—"}</p>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setEditing(true)} style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s", background: "none", border: "none", cursor: "pointer", color: "#A09890", padding: 2, display: "flex" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B2B")} onMouseLeave={(e) => (e.currentTarget.style.color = "#A09890")}>
            <Pencil size={11} />
          </button>
          <span style={S.pill(g.bg, g.color)}>{lead.grade}</span>
        </div>
      </div>
      {(lead.city || lead.state) && (
        <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#A09890", marginBottom: 8 }}>
          <MapPin size={9} /> {[lead.city, lead.state].filter(Boolean).join(", ")}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {lead.total_emails_sent > 0 && (
          <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#A09890", display: "flex", alignItems: "center", gap: 3 }}>
            <Mail size={8} /> {lead.total_emails_sent}
          </span>
        )}
        {lead.open_count > 0 && <span style={S.pill("#EEF4FF", "#1E5FAA")}>{lead.open_count} opens</span>}
        {lead.click_count > 0 && <span style={S.pill("#FFF3EE", "#FF6B2B")}>{lead.click_count} clicks</span>}
        {lead.response_received && <span style={S.pill("#ECFBF0", "#1E7A3C")}>replied</span>}
      </div>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, color: "#A09890", backgroundColor: "#F8F5F0",
          border: "1px solid #E8E2D8", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
        }}
      >
        <span>Move to…</span><ChevronDown size={10} />
      </button>
      <MoveDropdown
        btnRef={btnRef} open={open} stages={stages}
        onSelect={(id) => { onMove(lead.id, id as TradesStage); setOpen(false); }}
      />
      {editing && <EditTradesModal lead={lead} onClose={() => setEditing(false)} onSaved={(u) => { onEdited(u); setEditing(false); }} />}
    </div>
  );
}

// ── Inbound card ──────────────────────────────────────────────────────────────

function InboundCard({ lead, stages, onMove, onDragStart, onEdited }: {
  lead: InboundLead;
  stages: typeof INBOUND_STAGES;
  onMove: (id: string, s: InboundStage) => void;
  onDragStart: (id: string, type: "inbound") => void;
  onEdited: (updated: InboundLead) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sourceColors: Record<string, { bg: string; color: string }> = {
    referral:  { bg: "#EEF4FF", color: "#1E5FAA" },
    instagram: { bg: "#FFF0F7", color: "#9C2E6F" },
    website:   { bg: "#F0EBE1", color: "#6B6560" },
    contra:    { bg: "#F5F0E8", color: "#6B6560" },
    cold_dm:   { bg: "#FFF3EE", color: "#FF6B2B" },
    other:     { bg: "#F0EBE1", color: "#A09890" },
  };
  const sc = sourceColors[lead.source ?? "other"] ?? sourceColors.other;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    setTimeout(() => document.addEventListener("click", close), 0);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(lead.id, "inbound"); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...S.card, cursor: "grab" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: "#1E1C1A", lineHeight: 1.3 }}>
          {lead.business_name || lead.name || "—"}
        </p>
        <button onClick={() => setEditing(true)} style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s", background: "none", border: "none", cursor: "pointer", color: "#A09890", padding: 2, display: "flex", flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B2B")} onMouseLeave={(e) => (e.currentTarget.style.color = "#A09890")}>
          <Pencil size={11} />
        </button>
      </div>
      {lead.name && lead.business_name && (
        <p style={{ fontSize: 11, color: "#A09890", marginBottom: 6 }}>{lead.name}</p>
      )}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {lead.source && <span style={S.pill(sc.bg, sc.color)}>{lead.source.replace("_", " ")}</span>}
        {lead.referred_by && <span style={{ fontSize: 11, color: "#A09890" }}>via {lead.referred_by}</span>}
        {lead.budget_estimate && <span style={S.pill("#ECFBF0", "#1E7A3C")}>{lead.budget_estimate}</span>}
      </div>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, color: "#A09890", backgroundColor: "#F8F5F0",
          border: "1px solid #E8E2D8", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
        }}
      >
        <span>Move to…</span><ChevronDown size={10} />
      </button>
      <MoveDropdown
        btnRef={btnRef} open={open} stages={stages}
        onSelect={(id) => { onMove(lead.id, id as InboundStage); setOpen(false); }}
      />
      {editing && <EditInboundModal lead={lead} onClose={() => setEditing(false)} onSaved={(u) => { onEdited(u); setEditing(false); }} />}
    </div>
  );
}

// ── Add inbound modal ─────────────────────────────────────────────────────────

function AddInboundModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", business_name: "", email: "", phone: "", source: "referral", referred_by: "", budget_estimate: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.name && !form.business_name) return;
    setSaving(true);
    await supabase.from("inbound_leads").insert({ ...form, referred_by: form.referred_by || null, budget_estimate: form.budget_estimate || null, notes: form.notes || null, pipeline_stage: "new" });
    setSaving(false); onAdded(); onClose();
  }

  const inp = (label: string, key: keyof typeof form, placeholder?: string) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#6B6560", marginBottom: 4 }}>{label}</label>
      <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
        style={{ width: "100%", fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0", color: "#1E1C1A", fontFamily: "Inter, sans-serif" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(30,28,26,0.55)", backdropFilter: "blur(4px)" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "100%", maxWidth: 420, margin: "0 16px", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: "#1E1C1A" }}>Add Inbound Lead</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#A09890" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {inp("Contact Name", "name", "Jason R.")}
          {inp("Business Name", "business_name", "Ridge Roofing Co.")}
          {inp("Email", "email")}
          {inp("Phone", "phone")}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#6B6560", marginBottom: 4 }}>Source</label>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
              style={{ width: "100%", fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0", color: "#1E1C1A" }}>
              {["referral","instagram","website","contra","cold_dm","other"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_"," ")}</option>
              ))}
            </select>
          </div>
          {inp("Referred By", "referred_by", "Laura M.")}
          {inp("Budget Estimate", "budget_estimate", "$2,400")}
          {inp("Notes", "notes")}
        </div>
        <button onClick={submit} disabled={saving}
          style={{ marginTop: 20, width: "100%", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Add Lead"}
        </button>
      </div>
    </div>
  );
}

// ── Edit modals ───────────────────────────────────────────────────────────────

const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(30,28,26,0.55)", backdropFilter: "blur(4px)" };
const modalBox: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "100%", maxWidth: 440, margin: "0 16px", padding: 24, maxHeight: "90vh", overflowY: "auto" };

function FieldRow({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#6B6560", marginBottom: 4 }}>{label}</label>
      {type === "textarea"
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
            style={{ width: "100%", fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0", color: "#1E1C1A", fontFamily: "Inter, sans-serif", resize: "vertical" }} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            style={{ width: "100%", fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0", color: "#1E1C1A", fontFamily: "Inter, sans-serif" }} />
      }
    </div>
  );
}

function EditTradesModal({ lead, onClose, onSaved }: { lead: TradesLead; onClose: () => void; onSaved: (updated: TradesLead) => void }) {
  const [form, setForm] = useState({ business_name: lead.business_name ?? "", city: lead.city ?? "", state: lead.state ?? "", grade: lead.grade, email: lead.email ?? "", phone: lead.phone ?? "", notes: lead.notes ?? "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    const patch = { business_name: form.business_name || null, city: form.city || null, state: form.state || null, grade: form.grade as TradesLead["grade"], email: form.email || null, phone: form.phone || null, notes: form.notes || null };
    await supabase.from("roofing_leads").update(patch).eq("id", lead.id);
    onSaved({ ...lead, ...patch });
    setSaving(false); onClose();
  }

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: "#1E1C1A" }}>Edit Lead</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#A09890" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldRow label="Business Name" value={form.business_name} onChange={set("business_name")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldRow label="City" value={form.city} onChange={set("city")} />
            <FieldRow label="State" value={form.state} onChange={set("state")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#6B6560", marginBottom: 4 }}>Grade</label>
            <select value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value as TradesLead["grade"] }))}
              style={{ width: "100%", fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0", color: "#1E1C1A" }}>
              {["A","B","C","ungraded"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <FieldRow label="Email" value={form.email} onChange={set("email")} type="email" />
          <FieldRow label="Phone" value={form.phone} onChange={set("phone")} />
          <FieldRow label="Notes" value={form.notes} onChange={set("notes")} type="textarea" />
        </div>
        <button onClick={save} disabled={saving}
          style={{ marginTop: 20, width: "100%", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function EditInboundModal({ lead, onClose, onSaved }: { lead: InboundLead; onClose: () => void; onSaved: (updated: InboundLead) => void }) {
  const [form, setForm] = useState({ name: lead.name ?? "", business_name: lead.business_name ?? "", email: lead.email ?? "", phone: lead.phone ?? "", source: lead.source ?? "other", referred_by: lead.referred_by ?? "", budget_estimate: lead.budget_estimate ?? "", city: lead.city ?? "", state: lead.state ?? "", notes: lead.notes ?? "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    const patch = { name: form.name || null, business_name: form.business_name || null, email: form.email || null, phone: form.phone || null, source: form.source || null, referred_by: form.referred_by || null, budget_estimate: form.budget_estimate || null, city: form.city || null, state: form.state || null, notes: form.notes || null };
    await supabase.from("inbound_leads").update(patch).eq("id", lead.id);
    onSaved({ ...lead, ...patch });
    setSaving(false); onClose();
  }

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: "#1E1C1A" }}>Edit Lead</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#A09890" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldRow label="Contact Name" value={form.name} onChange={set("name")} />
          <FieldRow label="Business Name" value={form.business_name} onChange={set("business_name")} />
          <FieldRow label="Email" value={form.email} onChange={set("email")} type="email" />
          <FieldRow label="Phone" value={form.phone} onChange={set("phone")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldRow label="City" value={form.city} onChange={set("city")} />
            <FieldRow label="State" value={form.state} onChange={set("state")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#6B6560", marginBottom: 4 }}>Source</label>
            <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              style={{ width: "100%", fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0", color: "#1E1C1A" }}>
              {["referral","instagram","website","contra","cold_dm","other"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
            </select>
          </div>
          <FieldRow label="Referred By" value={form.referred_by} onChange={set("referred_by")} />
          <FieldRow label="Budget Estimate" value={form.budget_estimate} onChange={set("budget_estimate")} />
          <FieldRow label="Notes" value={form.notes} onChange={set("notes")} type="textarea" />
        </div>
        <button onClick={save} disabled={saving}
          style={{ marginTop: 20, width: "100%", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function Column({ label, color, count, children, onDrop, onDragOver, isDragOver }: {
  label: string; color: string; count: number; children: React.ReactNode;
  onDrop: () => void; onDragOver: () => void; isDragOver: boolean;
}) {
  return (
    <div
      style={{ minWidth: 210, maxWidth: 210, display: "flex", flexDirection: "column" }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragLeave={() => {}}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, padding: "0 2px" }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", color: "#A09890", backgroundColor: "#E8E2D8", padding: "1px 7px", borderRadius: 99 }}>{count}</span>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", gap: 6, flex: 1,
        minHeight: 60, borderRadius: 10, padding: isDragOver ? 4 : 0,
        border: isDragOver ? `2px dashed ${color}` : "2px solid transparent",
        backgroundColor: isDragOver ? `${color}10` : "transparent",
        transition: "all 0.15s",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, padding: "14px 20px", flex: 1 }}>
      <p style={{ fontSize: 10.5, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
      <p className="font-display" style={{ fontSize: 28, color: color ?? "#1E1C1A" }}>{value}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [tab, setTab] = useState<"trades" | "inbound">("trades");
  const [tradesLeads, setTradesLeads] = useState<TradesLead[]>([]);
  const [inboundLeads, setInboundLeads] = useState<InboundLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const dragRef = useRef<{ id: string; type: "trades" | "inbound" } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const loadTrades = useCallback(async () => {
    const { data } = await supabase.from("roofing_leads")
      .select("id,business_name,city,state,grade,score,pipeline_stage,sequence_status,sequence_step,outreach_sent,response_received,total_emails_sent,open_count,click_count,email,phone,website_url,notes,last_outreach_at,next_outreach_at,slug")
      .not("pipeline_stage", "eq", "closed_lost").order("score", { ascending: false });
    setTradesLeads((data as TradesLead[]) ?? []);
  }, []);

  const loadInbound = useCallback(async () => {
    const { data } = await supabase.from("inbound_leads").select("*").not("pipeline_stage", "eq", "closed_lost").order("created_at", { ascending: false });
    setInboundLeads((data as InboundLead[]) ?? []);
  }, []);

  async function load() { setLoading(true); await Promise.all([loadTrades(), loadInbound()]); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function moveTradesLead(id: string, stage: TradesStage) {
    setTradesLeads((p) => p.map((l) => l.id === id ? { ...l, pipeline_stage: stage } : l));
    await supabase.from("roofing_leads").update({ pipeline_stage: stage }).eq("id", id);
  }

  async function moveInboundLead(id: string, stage: InboundStage) {
    setInboundLeads((p) => p.map((l) => l.id === id ? { ...l, pipeline_stage: stage } : l));
    await supabase.from("inbound_leads").update({ pipeline_stage: stage }).eq("id", id);
  }

  const tradesByStage  = (s: TradesStage)  => tradesLeads.filter((l) => l.pipeline_stage === s);
  const inboundByStage = (s: InboundStage) => inboundLeads.filter((l) => l.pipeline_stage === s);

  const activeCount    = tradesLeads.filter((l) => l.pipeline_stage === "outreach_active").length;
  const respondedCount = tradesLeads.filter((l) => l.pipeline_stage === "responded").length;
  const hotCount       = tradesLeads.filter((l) => ["call_booked","proposal_sent"].includes(l.pipeline_stage)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, minHeight: 0 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        <Stat label="In Sequence" value={activeCount}    color="#1E5FAA" />
        <Stat label="Responded"   value={respondedCount} color="#B86B10" />
        <Stat label="Hot"         value={hotCount}       color="#FF6B2B" />
      </div>

      {/* Tab + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["trades", "inbound"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12.5, fontWeight: 500, transition: "all 0.15s",
                backgroundColor: tab === t ? "#FF6B2B" : "transparent",
                color: tab === t ? "#fff" : "#6B6560",
              }}>
              {t === "trades" ? "Trades Outreach" : "Inbound / WOM"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load}
            style={{ padding: "7px 10px", border: "1px solid #E8E2D8", borderRadius: 8, backgroundColor: "#fff", cursor: "pointer", color: "#6B6560", display: "flex", alignItems: "center" }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          {tab === "inbound" && (
            <button onClick={() => setShowAdd(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
              <Plus size={13} /> Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "60px 0", color: "#A09890" }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 16 }} onDragEnd={() => { dragRef.current = null; setDragOver(null); }}>
          <div style={{ display: "flex", gap: 14, minWidth: "max-content" }}>
            {tab === "trades"
              ? TRADES_STAGES.map((stage) => (
                  <Column
                    key={stage.id} label={stage.label} color={stage.color} count={tradesByStage(stage.id).length}
                    isDragOver={dragOver === stage.id}
                    onDragOver={() => setDragOver(stage.id)}
                    onDrop={() => {
                      if (dragRef.current?.type === "trades") moveTradesLead(dragRef.current.id, stage.id as TradesStage);
                      setDragOver(null);
                    }}
                  >
                    {tradesByStage(stage.id).length === 0
                      ? <div style={{ border: "1px dashed #E8E2D8", borderRadius: 8, padding: "14px", fontSize: 11.5, color: "#C8C0B8", textAlign: "center" }}>Empty</div>
                      : tradesByStage(stage.id).map((l) => (
                          <TradesCard key={l.id} lead={l} stages={TRADES_STAGES} onMove={moveTradesLead}
                            onDragStart={(id, type) => { dragRef.current = { id, type }; }}
                            onEdited={(u) => setTradesLeads((p) => p.map((x) => x.id === u.id ? u : x))} />
                        ))
                    }
                  </Column>
                ))
              : INBOUND_STAGES.map((stage) => (
                  <Column
                    key={stage.id} label={stage.label} color={stage.color} count={inboundByStage(stage.id).length}
                    isDragOver={dragOver === stage.id}
                    onDragOver={() => setDragOver(stage.id)}
                    onDrop={() => {
                      if (dragRef.current?.type === "inbound") moveInboundLead(dragRef.current.id, stage.id as InboundStage);
                      setDragOver(null);
                    }}
                  >
                    {inboundByStage(stage.id).length === 0
                      ? <div style={{ border: "1px dashed #E8E2D8", borderRadius: 8, padding: "14px", fontSize: 11.5, color: "#C8C0B8", textAlign: "center" }}>Empty</div>
                      : inboundByStage(stage.id).map((l) => (
                          <InboundCard key={l.id} lead={l} stages={INBOUND_STAGES} onMove={moveInboundLead}
                            onDragStart={(id, type) => { dragRef.current = { id, type }; }}
                            onEdited={(u) => setInboundLeads((p) => p.map((x) => x.id === u.id ? u : x))} />
                        ))
                    }
                  </Column>
                ))
            }
          </div>
        </div>
      )}

      {showAdd && <AddInboundModal onClose={() => setShowAdd(false)} onAdded={loadInbound} />}
    </div>
  );
}
