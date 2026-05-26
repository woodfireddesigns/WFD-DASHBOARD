"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Plus, Flame, Target, Zap, Trophy, Edit2, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Habit {
  id: string;
  name: string;
  icon: string;
  points: number;
  sort_order: number;
  is_active: boolean;
}

interface HabitCompletion {
  habit_id: string;
  date: string;
  points: number;
}

interface SummaryStats {
  tasksToday: number;
  tasksDone: number;
  activeProjects: number;
  hotLeads: number;
  outstandingInvoices: number;
  outstandingAmount: number;
}

// ── Level system ──────────────────────────────────────────────────────────────

const LEVELS = [
  { name: "Raw Material",    min: 0,     color: "#5A4E46" },
  { name: "Kindling",        min: 200,   color: "#8B6914" },
  { name: "Spark",           min: 500,   color: "#D4821A" },
  { name: "Ember",           min: 1000,  color: "#E8631A" },
  { name: "Flame",           min: 2000,  color: "#FF6B2B" },
  { name: "Forge Fire",      min: 3500,  color: "#FF8C00" },
  { name: "Iron",            min: 5000,  color: "#B0BEC5" },
  { name: "Steel",           min: 7000,  color: "#90A4AE" },
  { name: "Master Craftsman",min: 9500,  color: "#FF6B2B" },
  { name: "The Forge",       min: 12000, color: "#FFD700" },
];

function getLevel(points: number) {
  let lvl = LEVELS[0];
  let nextLvl = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) { lvl = LEVELS[i]; nextLvl = LEVELS[i + 1] ?? LEVELS[i]; break; }
  }
  const progress = nextLvl === lvl ? 100 : Math.min(100, Math.round(((points - lvl.min) / (nextLvl.min - lvl.min)) * 100));
  return { ...lvl, nextLvl, progress, levelIndex: LEVELS.indexOf(lvl) + 1 };
}

const today = new Date().toISOString().slice(0, 10);

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: "#161310", border: `1px solid ${accent ? "rgba(255,107,43,0.3)" : "#2A241E"}`,
      borderRadius: 10, padding: "16px 20px", flex: 1,
      boxShadow: accent ? "0 0 20px rgba(255,107,43,0.06)" : "none",
    }}>
      <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.1em", color: "#5A4E46", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: accent ? "#FF6B2B" : "#F2EDE8", lineHeight: 1, letterSpacing: "0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: "#5A4E46", marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<HabitCompletion[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", icon: "🔥", points: 10 });
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [habitsRes, todayRes, allRes, tasksRes, projectsRes, leadsRes, invoicesRes] = await Promise.all([
      supabase.from("habits").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("habit_completions").select("*").eq("date", today),
      supabase.from("habit_completions").select("points"),
      supabase.from("tasks").select("status").eq("date", today),
      supabase.from("projects").select("status").in("status", ["discovery","design","build","review"]),
      supabase.from("roofing_leads").select("pipeline_stage").in("pipeline_stage", ["call_booked","proposal_sent","responded"]),
      supabase.from("invoices").select("amount,status").eq("status", "sent"),
    ]);

    setHabits((habitsRes.data as Habit[]) ?? []);
    setCompletions((todayRes.data as HabitCompletion[]) ?? []);
    setAllCompletions((allRes.data as HabitCompletion[]) ?? []);

    const tasks = (tasksRes.data ?? []) as { status: string }[];
    const invoices = (invoicesRes.data ?? []) as { amount: number; status: string }[];
    setStats({
      tasksToday: tasks.length,
      tasksDone: tasks.filter(t => t.status === "done").length,
      activeProjects: (projectsRes.data ?? []).length,
      hotLeads: (leadsRes.data ?? []).length,
      outstandingInvoices: invoices.length,
      outstandingAmount: invoices.reduce((s, i) => s + (i.amount ?? 0), 0),
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPoints = allCompletions.reduce((s, c) => s + (c.points ?? 0), 0);
  const level = getLevel(totalPoints);
  const todayPoints = completions.reduce((s, c) => s + (c.points ?? 0), 0);

  const isCompleted = (habitId: string) => completions.some(c => c.habit_id === habitId);

  async function toggleHabit(habit: Habit) {
    if (toggling) return;
    setToggling(habit.id);
    const done = isCompleted(habit.id);
    if (done) {
      await supabase.from("habit_completions").delete().eq("habit_id", habit.id).eq("date", today);
      setCompletions(p => p.filter(c => c.habit_id !== habit.id));
      setAllCompletions(p => p.filter(c => !(c.habit_id === habit.id)));
    } else {
      const { data } = await supabase.from("habit_completions").insert({ habit_id: habit.id, date: today, points: habit.points }).select().single();
      if (data) { setCompletions(p => [...p, data as HabitCompletion]); setAllCompletions(p => [...p, data as HabitCompletion]); }
    }
    setToggling(null);
  }

  async function addHabit() {
    if (!newHabit.name.trim()) return;
    const { data } = await supabase.from("habits").insert({
      name: newHabit.name.trim(), icon: newHabit.icon || "🔥",
      points: newHabit.points, sort_order: habits.length,
    }).select().single();
    if (data) setHabits(p => [...p, data as Habit]);
    setNewHabit({ name: "", icon: "🔥", points: 10 });
    setAddingHabit(false);
  }

  async function saveHabit(h: Habit) {
    await supabase.from("habits").update({ name: h.name, icon: h.icon, points: h.points }).eq("id", h.id);
    setHabits(p => p.map(x => x.id === h.id ? h : x));
    setEditingHabit(null);
  }

  async function deleteHabit(id: string) {
    await supabase.from("habits").update({ is_active: false }).eq("id", id);
    setHabits(p => p.filter(x => x.id !== id));
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Flame size={24} color="#FF6B2B" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100 }}>

      {/* Greeting */}
      <div>
        <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 28, color: "#F2EDE8", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }}>
          {greeting}, Michael.
        </h2>
        <p style={{ fontSize: 13.5, color: "#5A4E46" }}>
          {stats?.tasksDone === stats?.tasksToday && (stats?.tasksToday ?? 0) > 0
            ? "All tasks done today. Keep the fire going."
            : `${stats?.tasksDone ?? 0} of ${stats?.tasksToday ?? 0} tasks done today.`}
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Tasks Today" value={`${stats?.tasksDone ?? 0}/${stats?.tasksToday ?? 0}`} sub="completed" accent={(stats?.tasksDone ?? 0) === (stats?.tasksToday ?? 0) && (stats?.tasksToday ?? 0) > 0} />
        <StatCard label="Active Projects" value={stats?.activeProjects ?? 0} sub="in progress" />
        <StatCard label="Hot Leads" value={stats?.hotLeads ?? 0} sub="need attention" accent={(stats?.hotLeads ?? 0) > 0} />
        <StatCard label="Outstanding" value={stats?.outstandingAmount ? `$${stats.outstandingAmount.toLocaleString()}` : "$0"} sub={`${stats?.outstandingInvoices ?? 0} invoice${(stats?.outstandingInvoices ?? 0) !== 1 ? "s" : ""}`} accent={(stats?.outstandingAmount ?? 0) > 0} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#1E1A16" }} />

      {/* Habit tracker + Level side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

        {/* Habits */}
        <div style={{ background: "#161310", border: "1px solid #2A241E", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 15, color: "#F2EDE8", textTransform: "uppercase", letterSpacing: "0.04em" }}>Daily Habits</p>
              <p style={{ fontSize: 11.5, color: "#5A4E46", marginTop: 2 }}>+{todayPoints} pts earned today</p>
            </div>
            <button onClick={() => setAddingHabit(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)", borderRadius: 6, color: "#FF6B2B", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              <Plus size={12} /> Add Habit
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.map(habit => {
              const done = isCompleted(habit.id);
              const isToggling = toggling === habit.id;
              return (
                <div
                  key={habit.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: done ? "rgba(255,107,43,0.05)" : "#0F0D0B",
                    border: `1px solid ${done ? "rgba(255,107,43,0.2)" : "#2A241E"}`,
                    borderRadius: 8, transition: "all 0.2s", cursor: "pointer",
                  }}
                  onClick={() => toggleHabit(habit)}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${done ? "#FF6B2B" : "#2A241E"}`,
                    background: done ? "#FF6B2B" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", opacity: isToggling ? 0.5 : 1,
                  }}>
                    {done && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 16 }}>{habit.icon}</span>
                  <p style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: done ? "#5A4E46" : "#F2EDE8", textDecoration: done ? "line-through" : "none" }}>
                    {habit.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: done ? "#FF6B2B" : "#3D342C" }}>+{habit.points}pts</span>
                    <button onClick={(e) => { e.stopPropagation(); setEditingHabit(habit); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#3D342C", padding: 2, opacity: 0, transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
                      <Edit2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            {habits.length === 0 && (
              <p style={{ fontSize: 13, color: "#3D342C", textAlign: "center", padding: "20px 0" }}>No habits yet. Add one to start your journey.</p>
            )}
          </div>

          {/* Add habit form */}
          {addingHabit && (
            <div style={{ marginTop: 12, background: "#0F0D0B", border: "1px solid #2A241E", borderRadius: 8, padding: "14px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={newHabit.icon} onChange={e => setNewHabit(p => ({ ...p, icon: e.target.value }))}
                  style={{ width: 44, fontSize: 18, background: "#161310", border: "1px solid #2A241E", borderRadius: 6, padding: "6px", textAlign: "center", color: "#F2EDE8", outline: "none" }} />
                <input autoFocus value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") addHabit(); if (e.key === "Escape") setAddingHabit(false); }}
                  placeholder="Habit name…"
                  style={{ flex: 1, fontSize: 13.5, background: "#161310", border: "1px solid #2A241E", borderRadius: 6, padding: "6px 10px", color: "#F2EDE8", outline: "none", fontFamily: "Inter, sans-serif" }} />
                <input type="number" value={newHabit.points} onChange={e => setNewHabit(p => ({ ...p, points: parseInt(e.target.value) || 10 }))}
                  style={{ width: 56, fontSize: 13, background: "#161310", border: "1px solid #2A241E", borderRadius: 6, padding: "6px 8px", color: "#FF6B2B", outline: "none", textAlign: "center", fontFamily: "JetBrains Mono, monospace" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addHabit} style={{ flex: 1, padding: "7px", background: "#FF6B2B", border: "none", borderRadius: 6, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Add</button>
                <button onClick={() => setAddingHabit(false)} style={{ padding: "7px 14px", background: "none", border: "1px solid #2A241E", borderRadius: 6, color: "#5A4E46", fontSize: 12.5, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Level + XP */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Level card */}
          <div style={{ background: "#161310", border: "1px solid #2A241E", borderRadius: 12, padding: "22px 24px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Trophy size={16} color="#FF6B2B" />
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 13, color: "#F2EDE8", textTransform: "uppercase", letterSpacing: "0.04em" }}>365-Day Journey</p>
            </div>

            {/* Level */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <p style={{ fontFamily: "Anton, sans-serif", fontSize: 22, color: level.color, textTransform: "uppercase", letterSpacing: "0.03em" }}>{level.name}</p>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5A4E46" }}>LVL {level.levelIndex}</p>
              </div>
              <div style={{ height: 6, background: "#1E1A16", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99, width: `${level.progress}%`,
                  background: `linear-gradient(90deg, ${level.color}, ${level.color}CC)`,
                  transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: `0 0 8px ${level.color}60`,
                }} />
              </div>
              <p style={{ fontSize: 11, color: "#3D342C", marginTop: 5 }}>
                {level.progress}% → {level.nextLvl.name}
              </p>
            </div>

            {/* Stats */}
            {[
              { icon: <Zap size={12} color="#FF6B2B" />, label: "Total XP", val: `${totalPoints.toLocaleString()} pts` },
              { icon: <Flame size={12} color="#FF9500" />, label: "Today", val: `+${todayPoints} pts` },
              { icon: <Target size={12} color="#5A4E46" />, label: "Habits done", val: `${completions.length}/${habits.length}` },
            ].map(({ icon, label, val }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1E1A16" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {icon}
                  <p style={{ fontSize: 12.5, color: "#5A4E46" }}>{label}</p>
                </div>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#9A8E85" }}>{val}</p>
              </div>
            ))}

            {/* Year progress */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <p style={{ fontSize: 11, color: "#3D342C" }}>Year progress</p>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#3D342C" }}>
                  {Math.round((new Date().getDate() + new Date().getMonth() * 30.4) / 3.65)}%
                </p>
              </div>
              <div style={{ height: 3, background: "#1E1A16", borderRadius: 99 }}>
                <div style={{
                  height: "100%", borderRadius: 99, width: `${Math.round((new Date().getDate() + new Date().getMonth() * 30.4) / 3.65)}%`,
                  background: "#2A241E",
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit habit modal */}
      {editingHabit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,9,7,0.8)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingHabit(null); }}>
          <div style={{ background: "#161310", border: "1px solid #2A241E", borderRadius: 12, padding: 24, width: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 16, color: "#F2EDE8", textTransform: "uppercase" }}>Edit Habit</p>
              <button onClick={() => setEditingHabit(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5A4E46" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={editingHabit.icon} onChange={e => setEditingHabit(p => p ? { ...p, icon: e.target.value } : p)}
                style={{ width: 52, fontSize: 20, background: "#0F0D0B", border: "1px solid #2A241E", borderRadius: 6, padding: "8px", textAlign: "center", color: "#F2EDE8", outline: "none" }} />
              <input value={editingHabit.name} onChange={e => setEditingHabit(p => p ? { ...p, name: e.target.value } : p)}
                style={{ flex: 1, fontSize: 13.5, background: "#0F0D0B", border: "1px solid #2A241E", borderRadius: 6, padding: "8px 12px", color: "#F2EDE8", outline: "none", fontFamily: "Inter, sans-serif" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <p style={{ fontSize: 12.5, color: "#5A4E46" }}>Points per completion</p>
              <input type="number" value={editingHabit.points} onChange={e => setEditingHabit(p => p ? { ...p, points: parseInt(e.target.value) || 10 } : p)}
                style={{ width: 70, fontSize: 13, background: "#0F0D0B", border: "1px solid #2A241E", borderRadius: 6, padding: "6px 8px", color: "#FF6B2B", outline: "none", textAlign: "center", fontFamily: "JetBrains Mono, monospace" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => saveHabit(editingHabit)} style={{ flex: 1, padding: "9px", background: "#FF6B2B", border: "none", borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save</button>
              <button onClick={() => { deleteHabit(editingHabit.id); setEditingHabit(null); }}
                style={{ padding: "9px 16px", background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 7, color: "#C0392B", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
