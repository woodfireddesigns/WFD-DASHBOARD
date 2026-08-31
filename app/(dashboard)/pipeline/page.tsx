"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  STAGES, OPEN_STAGES, FIRST_STAGE, stageOf, SOURCES, SOURCE_COLOR,
  DEAL_COLUMNS, dealLabel, money, type Deal,
} from "@/lib/pipeline";
import {
  T, card, input, label as labelStyle, primaryButton, ghostButton, pill,
  modalOverlay, modalBox, wash,
} from "@/lib/theme";
import { Plus, X, Loader2, Pencil, Trash2, MapPin, Calendar } from "lucide-react";

/**
 * One board, one table, five stages.
 *
 * What went: the Trades Outreach tab and everything that fed it -- grades,
 * open and click counts, sequence steps, the second stage vocabulary. That was
 * a cold-email campaign's dashboard living inside a studio's CRM, and the
 * campaign is parked. The outreach API routes are untouched, so nothing is
 * lost if it comes back; it just no longer decides what this screen looks like.
 *
 * What arrived: a value, a next step, and a date to do it by, which is what a
 * pipeline is actually for.
 */

// ── Card ─────────────────────────────────────────────────────────────────────

function DealCard({ deal, onEdit, onDragStart, dragging }: {
  deal: Deal;
  onEdit: () => void;
  onDragStart: () => void;
  dragging: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const source = deal.source ?? "other";
  const overdue =
    deal.follow_up_at !== null &&
    deal.follow_up_at <= new Date().toISOString().slice(0, 10);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={onEdit}
      style={{
        ...card,
        cursor: "grab",
        opacity: dragging ? 0.4 : 1,
        borderColor: hovered ? T.borderHover : T.border,
        transition: "border-color 0.15s, opacity 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.35, minWidth: 0 }}>
          {dealLabel(deal)}
        </p>
        <button
          onClick={onEdit}
          title="Edit"
          aria-label={`Edit ${dealLabel(deal)}`}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 2,
            display: "flex", flexShrink: 0,
            // Visible at rest, not conjured by hover. The old board hid every
            // edit control at opacity 0 until you found it with the pointer.
            color: hovered ? T.brand : T.muted,
            transition: "color 0.15s",
          }}
        >
          <Pencil size={12} />
        </button>
      </div>

      {deal.name && deal.business_name && (
        <p style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{deal.name}</p>
      )}

      {deal.value !== null && deal.value > 0 && (
        <p style={{ fontFamily: T.mono, fontSize: 13, color: T.text2, marginTop: 6 }}>
          {money(deal.value)}
        </p>
      )}

      {(deal.city || deal.state) && (
        <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.muted, marginTop: 5 }}>
          <MapPin size={9} /> {[deal.city, deal.state].filter(Boolean).join(", ")}
        </p>
      )}

      {deal.next_step && (
        <p style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.4 }}>
          <span style={{ color: T.muted }}>Next: </span>{deal.next_step}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 9 }}>
        {deal.follow_up_at && (
          <span style={pill(overdue ? T.danger : T.muted)}>
            <Calendar size={9} />
            {new Date(`${deal.follow_up_at}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {deal.source && (
          <span style={pill(SOURCE_COLOR[source] ?? T.muted)}>{source.replace(/_/g, " ")}</span>
        )}
        {(deal.service_interest ?? []).slice(0, 2).map((s) => (
          <span key={s} style={{ ...pill(T.muted), fontWeight: 500 }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ── Add / edit ───────────────────────────────────────────────────────────────

type Draft = {
  title: string; name: string; business_name: string; email: string; phone: string;
  city: string; state: string; source: string; referred_by: string;
  value: string; stage: string; next_step: string; follow_up_at: string; notes: string;
};

const emptyDraft = (): Draft => ({
  title: "", name: "", business_name: "", email: "", phone: "",
  city: "", state: "", source: "referral", referred_by: "",
  value: "", stage: FIRST_STAGE, next_step: "", follow_up_at: "", notes: "",
});

const draftOf = (d: Deal): Draft => ({
  title: d.title ?? "", name: d.name ?? "", business_name: d.business_name ?? "",
  email: d.email ?? "", phone: d.phone ?? "", city: d.city ?? "", state: d.state ?? "",
  source: d.source ?? "other", referred_by: d.referred_by ?? "",
  value: d.value === null ? "" : String(d.value), stage: d.stage,
  next_step: d.next_step ?? "", follow_up_at: d.follow_up_at ?? "", notes: d.notes ?? "",
});

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
          style={{ ...input, resize: "vertical" }}
        />
      ) : (
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={input}
        />
      )}
    </div>
  );
}

function DealModal({ deal, onClose, onSaved, onDeleted }: {
  /** null means "new deal". */
  deal: Deal | null;
  onClose: () => void;
  onSaved: (deal: Deal) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<Draft>(deal ? draftOf(deal) : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Draft) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.title.trim() && !form.business_name.trim() && !form.name.trim()) {
      setError("Give it a name — the deal, the company, or the person.");
      return;
    }
    setSaving(true);
    setError(null);

    const patch = {
      title: form.title.trim() || null,
      name: form.name.trim() || null,
      business_name: form.business_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      source: form.source || null,
      referred_by: form.referred_by.trim() || null,
      value: form.value.trim() === "" ? null : Number(form.value.replace(/[^0-9.]/g, "")),
      stage: form.stage,
      next_step: form.next_step.trim() || null,
      follow_up_at: form.follow_up_at || null,
      notes: form.notes.trim() || null,
    };

    const query = deal === null
      ? supabase.from("deals").insert(patch).select(DEAL_COLUMNS).single()
      : supabase.from("deals").update(patch).eq("id", deal.id).select(DEAL_COLUMNS).single();

    const { data, error: err } = await query;
    setSaving(false);

    // Surfaced, not swallowed. A failed write used to close the modal and look
    // exactly like a successful one until the next page load.
    if (err !== null || data === null) {
      setError(err?.message ?? "Could not save.");
      return;
    }
    onSaved(data as unknown as Deal);
    onClose();
  }

  async function remove() {
    if (deal === null) return;
    if (!confirm(`Delete "${dealLabel(deal)}"? This cannot be undone.`)) return;
    setSaving(true);
    const { error: err } = await supabase.from("deals").delete().eq("id", deal.id);
    setSaving(false);
    if (err !== null) { setError(err.message); return; }
    onDeleted(deal.id);
    onClose();
  }

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: T.text }}>
            {deal === null ? "New Deal" : "Edit Deal"}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Deal" value={form.title} onChange={set("title")} placeholder="Website + brand refresh" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Company" value={form.business_name} onChange={set("business_name")} />
            <Field label="Contact" value={form.name} onChange={set("name")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Email" value={form.email} onChange={set("email")} type="email" />
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Value ($)" value={form.value} onChange={set("value")} placeholder="4800" />
            <div>
              <label style={labelStyle}>Stage</label>
              <select value={form.stage} onChange={(e) => set("stage")(e.target.value)} style={input}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Next step" value={form.next_step} onChange={set("next_step")} placeholder="Send the quote" />
            <Field label="By" value={form.follow_up_at} onChange={set("follow_up_at")} type="date" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Source</label>
              <select value={form.source} onChange={(e) => set("source")(e.target.value)} style={input}>
                {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <Field label="Referred by" value={form.referred_by} onChange={set("referred_by")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City" value={form.city} onChange={set("city")} />
            <Field label="State" value={form.state} onChange={set("state")} />
          </div>
          <Field label="Notes" value={form.notes} onChange={set("notes")} type="textarea" />
        </div>

        {error !== null && (
          <p style={{ marginTop: 14, fontSize: 12.5, color: T.danger }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={save} disabled={saving} style={{ ...primaryButton, flex: 1, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : deal === null ? "Add Deal" : "Save Changes"}
          </button>
          {deal !== null && (
            <button
              onClick={remove}
              disabled={saving}
              style={{
                ...ghostButton,
                color: T.danger,
                borderColor: wash(T.danger, 0.35),
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Column ───────────────────────────────────────────────────────────────────

function Column({ stage, deals, onDrop, dragOver, onDragOver, children }: {
  stage: { id: string; label: string; color: string };
  deals: Deal[];
  onDrop: () => void;
  dragOver: boolean;
  onDragOver: () => void;
  children: React.ReactNode;
}) {
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div
      style={{ minWidth: 236, maxWidth: 236, display: "flex", flexDirection: "column" }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, padding: "0 2px" }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: stage.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: stage.color, flex: 1 }}>
          {stage.label}
        </span>
        <span style={{ fontSize: 10.5, fontFamily: T.mono, color: T.text2, backgroundColor: T.raised, padding: "1px 7px", borderRadius: 99 }}>
          {deals.length}
        </span>
      </div>

      {total > 0 && (
        <p style={{ fontFamily: T.mono, fontSize: 10.5, color: T.muted, marginBottom: 8, padding: "0 2px" }}>
          {money(total)}
        </p>
      )}

      <div style={{
        display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 70,
        borderRadius: 10, padding: 4,
        border: `2px dashed ${dragOver ? stage.color : "transparent"}`,
        backgroundColor: dragOver ? wash(stage.color, 0.08) : "transparent",
        transition: "all 0.15s",
      }}>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ ...card, padding: "14px 20px", flex: 1 }}>
      <p style={{ fontSize: 10.5, color: T.muted, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>
        {label}
      </p>
      <p className="font-display" style={{ fontSize: 27, color: color ?? T.text, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [adding, setAdding] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select(DEAL_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setLoadError(error?.message ?? null);
    setDeals((data as unknown as Deal[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moveTo(id: string, stage: string) {
    const before = deals;
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    const isTerminal = stageOf(stage).terminal === true;
    const { error } = await supabase
      .from("deals")
      .update({ stage, closed_at: isTerminal ? new Date().toISOString() : null })
      .eq("id", id);
    if (error !== null) setDeals(before);
  }

  const byStage = (id: string) => deals.filter((d) => d.stage === id);

  const open = deals.filter((d) => stageOf(d.stage).terminal !== true);
  const openValue = open.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const wonValue = deals
    .filter((d) => stageOf(d.stage).winning === true)
    .reduce((sum, d) => sum + (d.value ?? 0), 0);
  const dueToday = open.filter(
    (d) => d.follow_up_at !== null && d.follow_up_at <= new Date().toISOString().slice(0, 10)
  ).length;

  const columns = showClosed ? STAGES : OPEN_STAGES;
  const closedCount = deals.length - open.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Stat label="Open Deals" value={String(open.length)} />
        <Stat label="Open Value" value={money(openValue) || "$0"} color={T.brand} />
        <Stat label="Won" value={money(wonValue) || "$0"} color={T.success} />
        <Stat label="Due" value={String(dueToday)} color={dueToday > 0 ? T.danger : undefined} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowClosed((v) => !v)}
          style={{ ...ghostButton, padding: "7px 14px", color: showClosed ? T.text : T.text2 }}
        >
          {showClosed ? "Hide closed" : `Show closed${closedCount > 0 ? ` (${closedCount})` : ""}`}
        </button>
        <button
          onClick={() => setAdding(true)}
          style={{ ...primaryButton, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px" }}
        >
          <Plus size={13} /> New Deal
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "60px 0", color: T.muted }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : loadError !== null ? (
        <div style={{ ...card, textAlign: "center", padding: "28px 20px" }}>
          <p style={{ fontSize: 13, color: T.danger }}>Could not load the pipeline.</p>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{loadError}</p>
        </div>
      ) : deals.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: 13.5, color: T.text2 }}>Nothing in the pipeline yet.</p>
          <p style={{ fontSize: 12.5, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
            Add a deal when a conversation starts. Every public intake form drops what it
            captures straight into <span style={{ color: T.text2 }}>{stageOf(FIRST_STAGE).label}</span>.
          </p>
        </div>
      ) : (
        <div
          style={{ overflowX: "auto", paddingBottom: 16 }}
          onDragEnd={() => { setDragId(null); setDragOver(null); }}
        >
          <div style={{ display: "flex", gap: 12, minWidth: "max-content" }}>
            {columns.map((stage) => (
              <Column
                key={stage.id}
                stage={stage}
                deals={byStage(stage.id)}
                dragOver={dragOver === stage.id}
                onDragOver={() => setDragOver(stage.id)}
                onDrop={() => {
                  if (dragId !== null) moveTo(dragId, stage.id);
                  setDragId(null);
                  setDragOver(null);
                }}
              >
                {byStage(stage.id).length === 0 ? (
                  <div style={{
                    border: `1px dashed ${T.border}`, borderRadius: 8, padding: 14,
                    fontSize: 11.5, color: T.faint, textAlign: "center",
                  }}>
                    Empty
                  </div>
                ) : (
                  byStage(stage.id).map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      dragging={dragId === deal.id}
                      onDragStart={() => setDragId(deal.id)}
                      onEdit={() => setEditing(deal)}
                    />
                  ))
                )}
              </Column>
            ))}
          </div>
        </div>
      )}

      {(adding || editing !== null) && (
        <DealModal
          deal={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={(saved) =>
            setDeals((prev) =>
              prev.some((d) => d.id === saved.id)
                ? prev.map((d) => (d.id === saved.id ? saved : d))
                : [saved, ...prev]
            )
          }
          onDeleted={(id) => setDeals((prev) => prev.filter((d) => d.id !== id))}
        />
      )}
    </div>
  );
}
