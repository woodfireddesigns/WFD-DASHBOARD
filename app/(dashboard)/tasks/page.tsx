"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase, TaskTemplate, Cadence } from "@/lib/supabase";
import { Plus, Check, Star, Repeat, Trash2, Loader2, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cadenceLabel, localDay, templatesToMaterialise, isDueOn } from "@/lib/recurring";
import { T, card as cardBase, wash } from "@/lib/theme";

type Tier = "main" | "secondary" | "daily";
type View = "today" | "calendar";

interface Task {
  id: string;
  text: string;
  tier: Tier;
  status: "todo" | "done";
  project?: string | null;
  sort_order: number;
  date: string;
  template_id: string | null;
  estimate_minutes: number | null;
}

/**
 * The tier colours were #FF6B2B, #1E1C1A and #6B6560 — an orange and two greys
 * chosen for a white page. On the dashboard's actual near-black canvas the
 * second one was black-on-black: the words "Secondary Objectives" were being
 * painted and could not be seen. All three now come off the shared palette.
 */
const TIER_META: Record<Tier, { label: string; sublabel: string; cap?: number; color: string }> = {
  main:      { label: "Main Objectives",      sublabel: "Good day if done",  cap: 3, color: T.brand },
  secondary: { label: "Secondary Objectives", sublabel: "Great day if done",         color: T.text },
  daily:     { label: "Daily Recurring",      sublabel: "Non-negotiables",           color: T.text2 },
};

const TIER_LABELS: Record<Tier, string> = {
  main: "Main Objectives",
  secondary: "Secondary Objectives",
  daily: "Daily Recurring",
};

// Local, not UTC. `toISOString()` west of Greenwich rolls the date over in the
// afternoon, which would hand you tomorrow's empty list while you're still working.
const today = localDay();

const card: React.CSSProperties = { ...cardBase, padding: "11px 14px", transition: "border-color 0.15s" };

const CHIP: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 3,
  marginTop: 4, marginRight: 5, fontSize: 10.5,
  fontFamily: T.mono,
  padding: "1px 7px", borderRadius: 99,
};

// ── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, recurLabel, onToggle, onDelete, onEdit, onMove, onStopRecurring }: {
  task: Task;
  /** Human cadence for a materialised task, e.g. "Mon & Thu". */
  recurLabel?: string;
  onToggle: (id: string, current: "todo" | "done") => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onMove: (id: string, tier: Tier) => void;
  onStopRecurring: (templateId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [showMove, setShowMove] = useState(false);
  const done = task.status === "done";

  function commitEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.text) onEdit(task.id, trimmed);
    setEditing(false);
  }

  return (
    <div
      style={{
        ...card,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        opacity: done ? 0.6 : 1,
        borderColor: editing ? T.brand : hovered && !done ? T.borderHover : T.border,
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMove(false); }}
    >
      <button
        onClick={() => onToggle(task.id, task.status)}
        aria-label={done ? `Mark ${task.text} not done` : `Mark ${task.text} done`}
        style={{
          width: 18, height: 18, marginTop: editing ? 3 : 1,
          borderRadius: 5,
          border: done ? "none" : `1.5px solid ${T.borderHover}`,
          backgroundColor: done ? T.success : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      >
        {done && <Check size={10} strokeWidth={3} color="#0F0D0B" />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditText(task.text); setEditing(false); } }}
            style={{
              width: "100%", fontSize: 13.5, fontWeight: 500,
              color: T.text, border: "none", outline: "none",
              background: "transparent", fontFamily: T.body,
            }}
          />
        ) : (
          <p
            style={{
              fontSize: 13.5, fontWeight: 500,
              color: done ? T.muted : T.text,
              textDecoration: done ? "line-through" : "none",
              lineHeight: 1.4, cursor: done ? "default" : "text",
            }}
            onDoubleClick={() => { if (!done) { setEditText(task.text); setEditing(true); } }}
          >
            {task.text}
          </p>
        )}
        {task.project && (
          <span style={{ ...CHIP, color: T.text2, backgroundColor: T.raised }}>{task.project}</span>
        )}
        {task.estimate_minutes !== null && (
          <span style={{ ...CHIP, color: T.text2, backgroundColor: T.raised }}>
            <Clock size={9} /> {task.estimate_minutes}m
          </span>
        )}
        {task.template_id !== null && (
          <span style={{ ...CHIP, color: T.warning, backgroundColor: wash(T.warning) }}>
            <Repeat size={9} /> {recurLabel ?? "recurring"}
          </span>
        )}
      </div>

      {/* Action buttons. Faded until the row is hovered, but never invisible on
          touch: opacity bottoms out at a readable value rather than at zero. */}
      <div style={{
        display: "flex", gap: 4, alignItems: "center", flexShrink: 0,
        opacity: editing ? 0 : hovered ? 1 : 0.45, transition: "opacity 0.15s",
      }}>
        <button
          onClick={() => { setEditText(task.text); setEditing(true); }}
          title="Edit"
          aria-label={`Edit ${task.text}`}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.muted, fontSize: 12 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.brand)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
        >
          ✏︎
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMove((v) => !v)}
            title="Move to…"
            aria-label={`Move ${task.text} to another tier`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.muted, fontSize: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text2)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            ⇅
          </button>
          {showMove && (
            <div style={{
              position: "absolute", right: 0, top: "100%", zIndex: 50,
              background: T.raised, border: `1px solid ${T.border}`, borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: 180, padding: 4,
            }}>
              {(["main", "secondary", "daily"] as Tier[]).filter(t => t !== task.tier).map(t => (
                <button
                  key={t}
                  onClick={() => { onMove(task.id, t); setShowMove(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "7px 12px", fontSize: 12.5, color: T.text2,
                    background: "none", border: "none", cursor: "pointer",
                    borderRadius: 6, fontFamily: T.body,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.text2; }}
                >
                  → {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* A recurring row is today's instance of a standing commitment — deleting
            it alone would just bring it back on the next page load. So for those,
            the button stops the commitment instead, and says so. */}
        <button
          onClick={() => {
            if (task.template_id === null) { onDelete(task.id); return; }
            if (confirm(`Stop "${task.text}" recurring? Today's copy goes too.`)) {
              onStopRecurring(task.template_id);
            }
          }}
          title={task.template_id === null ? "Delete" : "Stop recurring"}
          aria-label={task.template_id === null ? `Delete ${task.text}` : `Stop ${task.text} recurring`}
          style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", padding: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.danger)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Add task ──────────────────────────────────────────────────────────────────

function AddTask({ onAdd, cta = "Add task" }: {
  onAdd: (text: string, project?: string) => Promise<void>;
  cta?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [project, setProject] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    await onAdd(text.trim(), project.trim() || undefined);
    setText(""); setProject(""); setSaving(false); setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12.5, color: T.muted,
          background: "none", border: "none", cursor: "pointer",
          padding: "6px 2px", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = T.brand)}
        onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
      >
        <Plus size={13} /> {cta}
      </button>
    );
  }

  return (
    <div style={{ ...card, border: `1.5px solid ${T.brand}` }}>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Task description…"
        style={{
          width: "100%", fontSize: 13.5, color: T.text,
          border: "none", outline: "none", background: "transparent",
          fontFamily: T.body,
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <input
          value={project}
          onChange={(e) => setProject(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
          placeholder="Project tag (optional)"
          style={{
            flex: 1, fontSize: 11.5, color: T.text2,
            backgroundColor: T.raised,
            border: "none", outline: "none",
            padding: "5px 10px", borderRadius: 6,
            fontFamily: T.mono,
          }}
        />
        <button
          onClick={submit}
          disabled={saving}
          style={{
            fontSize: 12, fontWeight: 600,
            backgroundColor: T.brand, color: "#fff",
            border: "none", cursor: "pointer",
            padding: "5px 14px", borderRadius: 6,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "…" : "Add"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Tier section ──────────────────────────────────────────────────────────────

function TierSection({ tier, tasks, templates, onToggle, onDelete, onAdd, onEdit, onMove, onStopRecurring }: {
  tier: Tier;
  tasks: Task[];
  templates: TaskTemplate[];
  onToggle: (id: string, current: "todo" | "done") => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, project?: string) => Promise<void>;
  onEdit: (id: string, text: string) => void;
  onMove: (id: string, tier: Tier) => void;
  onStopRecurring: (templateId: string) => void;
}) {
  const meta = TIER_META[tier];
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tier === "main"      && <Star   size={13} color={T.brand} fill={T.brand} />}
          {tier === "secondary" && <Star   size={13} color={T.text} />}
          {tier === "daily"     && <Repeat size={13} color={T.text2} />}
          <div>
            <span className="font-display" style={{ fontSize: 14, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 11.5, color: T.muted, marginLeft: 10 }}>{meta.sublabel}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {meta.cap && (
            <span style={{ fontSize: 10.5, color: T.muted, fontFamily: T.mono }}>max {meta.cap}</span>
          )}
          <span style={{
            fontSize: 11, fontFamily: T.mono, color: T.text2,
            backgroundColor: T.raised, padding: "2px 8px", borderRadius: 99,
          }}>
            {done}/{tasks.length}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {tasks.length === 0 && (
          <div style={{
            ...card, border: `1px dashed ${T.border}`, backgroundColor: "transparent",
            fontSize: 12.5, color: T.muted, textAlign: "center", padding: "14px 16px",
          }}>
            No tasks yet.
          </div>
        )}
        {tasks.map((t) => {
          const tpl = t.template_id === null ? undefined : templates.find((x) => x.id === t.template_id);
          return (
            <TaskRow
              key={t.id}
              task={t}
              recurLabel={tpl && cadenceLabel(tpl.cadence, tpl.weekdays)}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onMove={onMove}
              onStopRecurring={onStopRecurring}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 6 }}>
        <AddTask onAdd={onAdd} />
      </div>
    </section>
  );
}

// ── Recurring manager ─────────────────────────────────────────────────────────

const WEEKDAYS = [
  { n: 1, label: "M" }, { n: 2, label: "T" }, { n: 3, label: "W" },
  { n: 4, label: "T" }, { n: 5, label: "F" }, { n: 6, label: "S" }, { n: 7, label: "S" },
];

function RecurringManager({ templates, onAdd, onStop }: {
  templates: TaskTemplate[];
  onAdd: (input: { text: string; tier: Tier; cadence: Cadence; weekdays: number[]; estimate_minutes: number | null }) => Promise<void>;
  onStop: (templateId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cadence, setCadence] = useState<Cadence>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    if (cadence === "weekly" && weekdays.length === 0) return;
    setSaving(true);
    await onAdd({
      text: text.trim(),
      tier: "daily",
      cadence,
      weekdays: cadence === "weekly" ? [...weekdays].sort((a, b) => a - b) : [],
      estimate_minutes: minutes.trim() === "" ? null : Number(minutes),
    });
    setText(""); setMinutes(""); setCadence("daily"); setWeekdays([1]);
    setSaving(false); setOpen(false);
  }

  const blocked = saving || !text.trim() || (cadence === "weekly" && weekdays.length === 0);

  return (
    <section style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Repeat size={13} color={T.text2} />
        <span className="font-display" style={{ fontSize: 14, color: T.text2 }}>Recurring</span>
        <span style={{ fontSize: 11.5, color: T.muted }}>Show up on their own, every time they are due</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {templates.length === 0 && (
          <div style={{ ...card, border: `1px dashed ${T.border}`, backgroundColor: "transparent", fontSize: 12.5, color: T.muted, textAlign: "center", padding: "14px 16px" }}>
            Nothing recurring yet.
          </div>
        )}
        {templates.map((t) => (
          <div key={t.id} style={{ ...card, display: "flex", alignItems: "center", gap: 10 }}>
            <Repeat size={13} color={T.warning} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: T.text, lineHeight: 1.4 }}>{t.text}</p>
              <p style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginTop: 2 }}>
                {cadenceLabel(t.cadence, t.weekdays)}
                {t.estimate_minutes !== null && ` · ${t.estimate_minutes}m`}
              </p>
            </div>
            <button
              onClick={() => { if (confirm(`Stop "${t.text}" recurring?`)) onStop(t.id); }}
              title="Stop recurring"
              aria-label={`Stop ${t.text} recurring`}
              style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.danger)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 6 }}>
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted, background: "none", border: "none", cursor: "pointer", padding: "6px 2px", transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.brand)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            <Plus size={13} /> Add recurring task
          </button>
        ) : (
          <div style={{ ...card, border: `1.5px solid ${T.brand}` }}>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
              placeholder="What needs doing, every time…"
              style={{ width: "100%", fontSize: 13.5, color: T.text, border: "none", outline: "none", background: "transparent", fontFamily: T.body }}
            />

            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              {(["daily", "weekdays", "weekly"] as Cadence[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  style={{
                    fontSize: 11.5, padding: "4px 11px", borderRadius: 99, cursor: "pointer",
                    border: `1px solid ${cadence === c ? T.brand : T.border}`,
                    backgroundColor: cadence === c ? T.brandWash : "transparent",
                    color: cadence === c ? T.brand : T.text2,
                    fontFamily: T.body,
                  }}
                >
                  {c === "daily" ? "Every day" : c === "weekdays" ? "Mon–Fri" : "Pick days"}
                </button>
              ))}
            </div>

            {cadence === "weekly" && (
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {WEEKDAYS.map(({ n, label }) => {
                  const on = weekdays.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => setWeekdays((prev) => on ? prev.filter((d) => d !== n) : [...prev, n])}
                      aria-pressed={on}
                      aria-label={`Weekday ${n}`}
                      style={{
                        width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 11.5, fontWeight: 600,
                        border: `1px solid ${on ? T.brand : T.border}`,
                        backgroundColor: on ? T.brand : "transparent",
                        color: on ? "#fff" : T.text2,
                        fontFamily: T.body,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <input
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
                placeholder="Minutes (optional)"
                inputMode="numeric"
                style={{ flex: 1, fontSize: 11.5, color: T.text2, backgroundColor: T.raised, border: "none", outline: "none", padding: "6px 10px", borderRadius: 6, fontFamily: T.mono }}
              />
              <button
                onClick={submit}
                disabled={blocked}
                style={{
                  fontSize: 12, fontWeight: 600, backgroundColor: T.brand, color: "#fff",
                  border: "none", cursor: blocked ? "not-allowed" : "pointer", padding: "5px 14px", borderRadius: 6,
                  opacity: blocked ? 0.5 : 1,
                }}
              >
                {saving ? "…" : "Add"}
              </button>
              <button onClick={() => setOpen(false)} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The Monday on or before the 1st, so every month starts on a full week. */
function gridStart(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const shift = (first.getDay() + 6) % 7; // Sunday(0) -> 6, Monday(1) -> 0
  return new Date(year, month, 1 - shift);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * The month, and what is on it.
 *
 * Tasks already carry a `date`; the page only ever asked for one day of them,
 * so everything scheduled for tomorrow — and everything finished last week —
 * was invisible. The calendar reads the whole visible grid at once and shows
 * the recurring templates as ghosts on the days they are due but have not been
 * materialised into rows yet, because those days have not been opened.
 */
function CalendarView({ tasks, templates, month, onMonth, selected, onSelect }: {
  tasks: Task[];
  templates: TaskTemplate[];
  month: Date;
  onMonth: (d: Date) => void;
  selected: string;
  onSelect: (day: string) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = useMemo(() => {
    const start = gridStart(year, monthIndex);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [year, monthIndex]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const list = map.get(t.date);
      if (list === undefined) map.set(t.date, [t]);
      else list.push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 className="font-display" style={{ fontSize: 16, color: T.text }}>
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { icon: <ChevronLeft size={14} />, delta: -1, label: "Previous month" },
            { icon: <ChevronRight size={14} />, delta: 1, label: "Next month" },
          ].map(({ icon, delta, label }) => (
            <button
              key={label}
              onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))}
              aria-label={label}
              style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
                color: T.text2, cursor: "pointer", padding: "6px 9px", display: "flex",
              }}
            >
              {icon}
            </button>
          ))}
          <button
            onClick={() => { const now = new Date(); onMonth(new Date(now.getFullYear(), now.getMonth(), 1)); onSelect(today); }}
            style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
              color: T.text2, cursor: "pointer", padding: "6px 12px", fontSize: 12, fontFamily: T.body,
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5 }}>
        {DOW.map((d) => (
          <div key={d} style={{
            fontSize: 10, fontFamily: T.mono, color: T.muted,
            textTransform: "uppercase", letterSpacing: "0.08em",
            textAlign: "center", paddingBottom: 4,
          }}>
            {d}
          </div>
        ))}

        {days.map((date) => {
          const key = localDay(date);
          const inMonth = date.getMonth() === month.getMonth();
          const isToday = key === today;
          const isSelected = key === selected;
          const dayTasks = byDay.get(key) ?? [];
          const doneCount = dayTasks.filter((t) => t.status === "done").length;

          // Days ahead have no rows yet — the app materialises on the day. Show
          // what is due anyway, so the week reads as a plan and not as blanks.
          const ghosts =
            key > today && dayTasks.length === 0
              ? templates.filter((t) => t.active && isDueOn(t.cadence, t.weekdays, date))
              : [];

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                textAlign: "left",
                minHeight: 92,
                padding: "7px 8px",
                borderRadius: 9,
                cursor: "pointer",
                fontFamily: T.body,
                background: isSelected ? T.raised : inMonth ? T.surface : T.sunken,
                border: `1px solid ${isSelected ? T.brand : isToday ? T.brandEdge : T.border}`,
                opacity: inMonth ? 1 : 0.5,
                display: "flex", flexDirection: "column", gap: 3,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontFamily: T.mono, fontSize: 11,
                  color: isToday ? T.brand : inMonth ? T.text2 : T.muted,
                  fontWeight: isToday ? 700 : 400,
                }}>
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span style={{
                    fontFamily: T.mono, fontSize: 9.5,
                    color: doneCount === dayTasks.length ? T.success : T.muted,
                  }}>
                    {doneCount}/{dayTasks.length}
                  </span>
                )}
              </div>

              {dayTasks.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  style={{
                    fontSize: 10.5, lineHeight: 1.3,
                    color: t.status === "done" ? T.muted : T.text2,
                    textDecoration: t.status === "done" ? "line-through" : "none",
                    borderLeft: `2px solid ${t.tier === "main" ? T.brand : t.tier === "secondary" ? T.info : T.border}`,
                    paddingLeft: 5,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {t.text}
                </span>
              ))}

              {ghosts.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  style={{
                    fontSize: 10.5, lineHeight: 1.3, color: T.muted, fontStyle: "italic",
                    borderLeft: `2px dashed ${T.border}`, paddingLeft: 5,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {t.text}
                </span>
              ))}

              {dayTasks.length > 3 && (
                <span style={{ fontSize: 10, color: T.muted }}>+{dayTasks.length - 3} more</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [view, setView] = useState<View>("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selected, setSelected] = useState(today);

  /**
   * Load, then top up.
   *
   * Every template due today that has no task row yet gets one. The unique index
   * on (template_id, date) is the backstop for two tabs racing — a duplicate
   * insert loses harmlessly and the refetch below picks up whichever won.
   *
   * The window is wide enough for the calendar's whole grid, not just today,
   * but materialisation is still only ever done for today: writing rows for
   * days you have not reached would turn a plan into a backlog.
   */
  const load = useCallback(async (from: string, to: string) => {
    const [{ data: taskData }, { data: tplData }] = await Promise.all([
      supabase.from("tasks").select("*").gte("date", from).lte("date", to)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("task_templates").select("*").eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const rows = (taskData as Task[]) ?? [];
    const tpls = (tplData as TaskTemplate[]) ?? [];
    setTemplates(tpls);

    const todaysRows = rows.filter((t) => t.date === today);
    const present = new Set(todaysRows.map((t) => t.template_id).filter((id): id is string => id !== null));
    const due = from <= today && today <= to ? templatesToMaterialise(tpls, present) : [];

    if (due.length > 0) {
      const { data: created } = await supabase.from("tasks").insert(
        due.map((t, i) => ({
          text: t.text,
          tier: t.tier,
          status: "todo",
          project: t.project,
          date: today,
          sort_order: todaysRows.filter((r) => r.tier === t.tier).length + i,
          template_id: t.id,
          estimate_minutes: t.estimate_minutes,
        }))
      ).select();
      setTasks([...rows, ...((created as Task[]) ?? [])]);
    } else {
      setTasks(rows);
    }
    setLoading(false);
  }, []);

  // The window follows the view: one day for Today, the whole 42-cell grid for
  // the calendar, so paging months does not silently show an empty board.
  useEffect(() => {
    if (view === "today") { load(today, today); return; }
    const start = gridStart(month.getFullYear(), month.getMonth());
    load(localDay(start), localDay(addDays(start, 41)));
  }, [view, month, load]);

  async function stopRecurring(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    setTasks((prev) => prev.filter((t) => t.template_id !== templateId));
    await supabase.from("tasks").delete().eq("template_id", templateId).eq("date", today);
    await supabase.from("task_templates").update({ active: false }).eq("id", templateId);
  }

  async function addTemplate(input: {
    text: string; tier: Tier; cadence: Cadence; weekdays: number[]; estimate_minutes: number | null;
  }) {
    const { data } = await supabase.from("task_templates").insert({
      ...input, sort_order: templates.length, active: true,
    }).select().single();
    if (data) {
      setTemplates((prev) => [...prev, data as TaskTemplate]);
      if (view === "today") await load(today, today);
    }
  }

  async function toggle(id: string, current: "todo" | "done") {
    const next = current === "todo" ? "done" : "todo";
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: next } : t));
    await supabase.from("tasks").update({ status: next, done_at: next === "done" ? new Date().toISOString() : null }).eq("id", id);
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  /** `date` is explicit so the calendar can add to a day that is not today. */
  async function add(tier: Tier, text: string, project: string | undefined, date: string) {
    const maxOrder = tasks.filter((t) => t.tier === tier && t.date === date).length;
    const { data } = await supabase.from("tasks")
      .insert({ text, tier, status: "todo", project: project ?? null, date, sort_order: maxOrder })
      .select().single();
    if (data) setTasks((prev) => [...prev, data as Task]);
  }

  async function edit(id: string, text: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, text } : t));
    await supabase.from("tasks").update({ text }).eq("id", id);
  }

  async function move(id: string, tier: Tier) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, tier } : t));
    await supabase.from("tasks").update({ tier }).eq("id", id);
  }

  const todaysTasks = tasks.filter((t) => t.date === today);
  const byTier = (tier: Tier) => todaysTasks.filter((t) => t.tier === tier);
  const mainDone  = byTier("main").filter((t) => t.status === "done").length;
  const mainTotal = byTier("main").length;
  const secDone   = byTier("secondary").filter((t) => t.status === "done").length;
  const totalDone = todaysTasks.filter((t) => t.status === "done").length;

  const dayRating =
    mainTotal > 0 && mainDone === mainTotal && secDone > 0 ? "great"
    : mainTotal > 0 && mainDone === mainTotal ? "good"
    : "in-progress";

  const selectedTasks = tasks
    .filter((t) => t.date === selected)
    .sort((a, b) => a.tier.localeCompare(b.tier) || a.sort_order - b.sort_order);

  const viewToggle = (
    <div style={{ display: "inline-flex", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
      {(["today", "calendar"] as View[]).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          aria-pressed={view === v}
          style={{
            padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 500, fontFamily: T.body, transition: "all 0.15s",
            backgroundColor: view === v ? T.brand : "transparent",
            color: view === v ? "#fff" : T.text2,
          }}
        >
          {v === "today" ? "Today" : "Calendar"}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, color: T.muted, gap: 8 }}>
        <Loader2 size={16} className="animate-spin" />
        <span style={{ fontSize: 13 }}>Loading…</span>
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div style={{ maxWidth: 1080 }}>
        <div style={{ marginBottom: 20 }}>{viewToggle}</div>

        <CalendarView
          tasks={tasks}
          templates={templates}
          month={month}
          onMonth={setMonth}
          selected={selected}
          onSelect={setSelected}
        />

        <section style={{ marginTop: 28, paddingTop: 22, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <h3 className="font-display" style={{ fontSize: 14, color: T.text }}>
              {new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <span style={{ fontSize: 11.5, color: T.muted }}>
              {selected === today ? "Today" : selectedTasks.length === 0 ? "Nothing scheduled" : `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"}`}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 600 }}>
            {selectedTasks.map((t) => {
              const tpl = t.template_id === null ? undefined : templates.find((x) => x.id === t.template_id);
              return (
                <TaskRow
                  key={t.id}
                  task={t}
                  recurLabel={tpl && cadenceLabel(tpl.cadence, tpl.weekdays)}
                  onToggle={toggle}
                  onDelete={remove}
                  onEdit={edit}
                  onMove={move}
                  onStopRecurring={stopRecurring}
                />
              );
            })}
            <div style={{ marginTop: 2 }}>
              <AddTask
                cta={`Add task on ${new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                onAdd={(text, project) => add("secondary", text, project, selected)}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 20 }}>{viewToggle}</div>

      <div style={{
        ...card,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", marginBottom: 32,
      }}>
        <div>
          <p style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            Today
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: T.text }}>
            {totalDone} of {todaysTasks.length} complete
          </p>
        </div>
        <span style={{
          fontSize: 11.5, fontWeight: 600,
          padding: "5px 12px", borderRadius: 99,
          backgroundColor:
            dayRating === "great" ? T.success :
            dayRating === "good"  ? T.brand : T.raised,
          color: dayRating === "in-progress" ? T.text2 : "#0F0D0B",
        }}>
          {dayRating === "great" ? "Great Day" : dayRating === "good" ? "Good Day" : "In Progress"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {(["main", "secondary", "daily"] as Tier[]).map((tier) => (
          <TierSection
            key={tier}
            tier={tier}
            tasks={byTier(tier)}
            templates={templates}
            onToggle={toggle}
            onDelete={remove}
            onAdd={(text, project) => add(tier, text, project, today)}
            onEdit={edit}
            onMove={move}
            onStopRecurring={stopRecurring}
          />
        ))}
      </div>

      <RecurringManager templates={templates} onAdd={addTemplate} onStop={stopRecurring} />
    </div>
  );
}
