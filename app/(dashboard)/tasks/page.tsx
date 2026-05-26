"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Check, Star, Repeat, Trash2, Loader2 } from "lucide-react";

type Tier = "main" | "secondary" | "daily";

interface Task {
  id: string;
  text: string;
  tier: Tier;
  status: "todo" | "done";
  project?: string | null;
  sort_order: number;
  date: string;
}

const TIER_META: Record<Tier, { label: string; sublabel: string; cap?: number; color: string }> = {
  main:      { label: "Main Objectives",      sublabel: "Good day if done",  cap: 3, color: "#FF6B2B" },
  secondary: { label: "Secondary Objectives", sublabel: "Great day if done",         color: "#1E1C1A" },
  daily:     { label: "Daily Recurring",      sublabel: "Non-negotiables",           color: "#6B6560" },
};

const today = new Date().toISOString().slice(0, 10);

// ── Shared card style ─────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E8E2D8",
  borderRadius: 10,
  padding: "11px 14px",
  transition: "box-shadow 0.15s, border-color 0.15s",
};

// ── Task row ──────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<Tier, string> = {
  main: "Main Objectives",
  secondary: "Secondary Objectives",
  daily: "Daily Recurring",
};

function TaskRow({ task, onToggle, onDelete, onEdit, onMove }: {
  task: Task;
  onToggle: (id: string, current: "todo" | "done") => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onMove: (id: string, tier: Tier) => void;
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
        opacity: done ? 0.45 : 1,
        boxShadow: hovered && !done ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
        borderColor: editing ? "#FF6B2B" : hovered && !done ? "#D9D1C3" : "#E8E2D8",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMove(false); }}
    >
      <button
        onClick={() => onToggle(task.id, task.status)}
        style={{
          width: 18, height: 18, marginTop: editing ? 3 : 1,
          borderRadius: 5,
          border: done ? "none" : "1.5px solid #D9D1C3",
          backgroundColor: done ? "#1E7A3C" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      >
        {done && <Check size={10} strokeWidth={3} color="#fff" />}
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
              color: "#1E1C1A", border: "none", outline: "none",
              background: "transparent", fontFamily: "Inter, system-ui, sans-serif",
            }}
          />
        ) : (
          <p
            style={{
              fontSize: 13.5, fontWeight: 500,
              color: done ? "#A09890" : "#1E1C1A",
              textDecoration: done ? "line-through" : "none",
              lineHeight: 1.4, cursor: done ? "default" : "text",
            }}
            onDoubleClick={() => { if (!done) { setEditText(task.text); setEditing(true); } }}
          >
            {task.text}
          </p>
        )}
        {task.project && (
          <span style={{
            display: "inline-block", marginTop: 4, fontSize: 10.5,
            fontFamily: "JetBrains Mono, monospace", color: "#A09890",
            backgroundColor: "#F0EBE1", padding: "1px 7px", borderRadius: 99,
          }}>
            {task.project}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, opacity: hovered && !editing ? 1 : 0, transition: "opacity 0.15s" }}>
        {/* Edit */}
        <button
          onClick={() => { setEditText(task.text); setEditing(true); }}
          title="Edit"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#C8C0B8", fontSize: 11 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B2B")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#C8C0B8")}
        >
          ✏︎
        </button>

        {/* Move */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMove((v) => !v)}
            title="Move to…"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#C8C0B8", fontSize: 11 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6B6560")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C8C0B8")}
          >
            ⇅
          </button>
          {showMove && (
            <div style={{
              position: "absolute", right: 0, top: "100%", zIndex: 50,
              background: "#fff", border: "1px solid #E8E2D8", borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 180, padding: 4,
            }}>
              {(["main", "secondary", "daily"] as Tier[]).filter(t => t !== task.tier).map(t => (
                <button
                  key={t}
                  onClick={() => { onMove(task.id, t); setShowMove(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "7px 12px", fontSize: 12.5, color: "#1E1C1A",
                    background: "none", border: "none", cursor: "pointer",
                    borderRadius: 6, fontFamily: "Inter, system-ui, sans-serif",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EBE1")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  → {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          style={{ color: "#C8C0B8", background: "none", border: "none", cursor: "pointer", padding: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#B83232")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#C8C0B8")}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Add task ──────────────────────────────────────────────────────────────────

function AddTask({ tier, onAdd }: {
  tier: Tier;
  onAdd: (text: string, project?: string) => Promise<void>;
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
          fontSize: 12.5, color: "#A09890",
          background: "none", border: "none", cursor: "pointer",
          padding: "6px 2px", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B2B")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#A09890")}
      >
        <Plus size={13} /> Add task
      </button>
    );
  }

  return (
    <div style={{ ...card, border: "1.5px solid #FF6B2B", padding: "11px 14px" }}>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Task description…"
        style={{
          width: "100%", fontSize: 13.5, color: "#1E1C1A",
          border: "none", outline: "none", background: "transparent",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <input
          value={project}
          onChange={(e) => setProject(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
          placeholder="Project tag (optional)"
          style={{
            flex: 1, fontSize: 11.5, color: "#6B6560",
            backgroundColor: "#F0EBE1",
            border: "none", outline: "none",
            padding: "4px 10px", borderRadius: 6,
            fontFamily: "JetBrains Mono, monospace",
          }}
        />
        <button
          onClick={submit}
          disabled={saving}
          style={{
            fontSize: 12, fontWeight: 600,
            backgroundColor: "#FF6B2B", color: "#fff",
            border: "none", cursor: "pointer",
            padding: "5px 14px", borderRadius: 6,
            opacity: saving ? 0.6 : 1,
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => { if (!saving) (e.currentTarget.style.backgroundColor = "#E85A1A"); }}
          onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = "#FF6B2B"); }}
        >
          {saving ? "…" : "Add"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ fontSize: 12, color: "#A09890", background: "none", border: "none", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Tier section ──────────────────────────────────────────────────────────────

function TierSection({ tier, tasks, onToggle, onDelete, onAdd, onEdit, onMove }: {
  tier: Tier;
  tasks: Task[];
  onToggle: (id: string, current: "todo" | "done") => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, project?: string) => Promise<void>;
  onEdit: (id: string, text: string) => void;
  onMove: (id: string, tier: Tier) => void;
}) {
  const meta = TIER_META[tier];
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <section>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tier === "main"      && <Star   size={13} color="#FF6B2B" fill="#FF6B2B" />}
          {tier === "secondary" && <Star   size={13} color="#1E1C1A" />}
          {tier === "daily"     && <Repeat size={13} color="#A09890" />}
          <div>
            <span className="font-display" style={{ fontSize: 14, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 11.5, color: "#A09890", marginLeft: 10 }}>{meta.sublabel}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {meta.cap && (
            <span style={{ fontSize: 10.5, color: "#C8C0B8", fontFamily: "JetBrains Mono, monospace" }}>
              max {meta.cap}
            </span>
          )}
          <span style={{
            fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#6B6560",
            backgroundColor: "#E8E2D8", padding: "2px 8px", borderRadius: 99,
          }}>
            {done}/{tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {tasks.length === 0 && (
          <div style={{
            ...card, border: "1px dashed #E8E2D8",
            fontSize: 12.5, color: "#C8C0B8", textAlign: "center", padding: "14px 16px",
          }}>
            No tasks yet.
          </div>
        )}
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onMove={onMove} />
        ))}
      </div>

      <div style={{ marginTop: 6 }}>
        <AddTask tier={tier} onAdd={onAdd} />
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("tasks").select("*").eq("date", today)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(id: string, current: "todo" | "done") {
    const next = current === "todo" ? "done" : "todo";
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: next } : t));
    await supabase.from("tasks").update({ status: next, done_at: next === "done" ? new Date().toISOString() : null }).eq("id", id);
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  async function add(tier: Tier, text: string, project?: string) {
    const maxOrder = tasks.filter((t) => t.tier === tier).length;
    const { data } = await supabase.from("tasks")
      .insert({ text, tier, status: "todo", project: project ?? null, date: today, sort_order: maxOrder })
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

  const byTier = (tier: Tier) => tasks.filter((t) => t.tier === tier);
  const mainDone  = byTier("main").filter((t) => t.status === "done").length;
  const mainTotal = byTier("main").length;
  const secDone   = byTier("secondary").filter((t) => t.status === "done").length;
  const totalDone = tasks.filter((t) => t.status === "done").length;

  const dayRating =
    mainTotal > 0 && mainDone === mainTotal && secDone > 0 ? "great"
    : mainTotal > 0 && mainDone === mainTotal ? "good"
    : "in-progress";

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, color: "#A09890", gap: 8 }}>
        <Loader2 size={16} className="animate-spin" />
        <span style={{ fontSize: 13 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Day status */}
      <div style={{
        ...card,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", marginBottom: 32,
      }}>
        <div>
          <p style={{ fontSize: 11, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            Today
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: "#1E1C1A" }}>
            {totalDone} of {tasks.length} complete
          </p>
        </div>
        <span style={{
          fontSize: 11.5, fontWeight: 600,
          padding: "5px 12px", borderRadius: 99,
          backgroundColor:
            dayRating === "great" ? "#1E7A3C" :
            dayRating === "good"  ? "#FF6B2B" : "#E8E2D8",
          color: dayRating === "in-progress" ? "#6B6560" : "#fff",
        }}>
          {dayRating === "great" ? "Great Day" : dayRating === "good" ? "Good Day" : "In Progress"}
        </span>
      </div>

      {/* Tiers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <TierSection tier="main"      tasks={byTier("main")}      onToggle={toggle} onDelete={remove} onAdd={(t, p) => add("main", t, p)}      onEdit={edit} onMove={move} />
        <TierSection tier="secondary" tasks={byTier("secondary")} onToggle={toggle} onDelete={remove} onAdd={(t, p) => add("secondary", t, p)} onEdit={edit} onMove={move} />
        <TierSection tier="daily"     tasks={byTier("daily")}     onToggle={toggle} onDelete={remove} onAdd={(t, p) => add("daily", t, p)}     onEdit={edit} onMove={move} />
      </div>
    </div>
  );
}
