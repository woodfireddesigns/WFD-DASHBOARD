"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, Project, Client, ProjectStatus, ProjectType, Deliverable } from "@/lib/supabase";
import { Plus, X, ChevronRight, Calendar, DollarSign, Loader2 } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  discovery: { label: "Discovery",  color: "#2B6CB0", bg: "bg-blue-50 text-[#2B6CB0]" },
  design:    { label: "Design",     color: "#C97B20", bg: "bg-orange-50 text-[#C97B20]" },
  build:     { label: "Build",      color: "#FF6B2B", bg: "bg-orange-100 text-[#FF6B2B]" },
  review:    { label: "Review",     color: "#6B5F50", bg: "bg-[#EAE4D8] text-[#6B5F50]" },
  delivered: { label: "Delivered",  color: "#2D7D46", bg: "bg-green-50 text-[#2D7D46]" },
  paused:    { label: "Paused",     color: "#B8AE9A", bg: "bg-[#F5F0E8] text-[#B8AE9A]" },
  cancelled: { label: "Cancelled",  color: "#C0392B", bg: "bg-red-50 text-[#C0392B]" },
};

const TYPE_LABELS: Record<ProjectType, string> = {
  brand_identity:  "Brand Identity",
  website:         "Website",
  packaging:       "Packaging",
  photography:     "Photography",
  merch:           "Merch",
  landing_page:    "Landing Page",
  social_campaign: "Social Campaign",
  ad_creative:     "Ad Creative",
  other:           "Other",
};

const ACTIVE_STATUSES: ProjectStatus[] = ["discovery", "design", "build", "review"];

function daysUntil(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return diff;
}

// ── New project modal ─────────────────────────────────────────────────────────

function NewProjectModal({ clients, onClose, onCreated }: {
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    client_id: "",
    name: "",
    type: "brand_identity" as ProjectType,
    status: "discovery" as ProjectStatus,
    deadline: "",
    value: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.client_id || !form.name) return;
    setSaving(true);
    await supabase.from("projects").insert({
      client_id: form.client_id,
      name: form.name,
      type: form.type,
      status: form.status,
      deadline: form.deadline || null,
      value: form.value ? parseInt(form.value) : null,
      notes: form.notes || null,
      deliverables: [],
    });
    setSaving(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2A28]/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="headline text-[20px] text-[#2C2A28]">New Project</h2>
          <button onClick={onClose} className="text-[#B8AE9A] hover:text-[#6B5F50]"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-[#6B5F50] mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28]"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#6B5F50] mb-1">Project Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Brand Identity Refresh"
              className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28] placeholder-[#B8AE9A]"
            />
          </div>
          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B5F50] mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
                className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28]"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5F50] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28]"
              >
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Deadline + Value row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B5F50] mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5F50] mb-1">Value ($)</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="2400"
                className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28] placeholder-[#B8AE9A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B5F50] mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Any context…"
              className="w-full text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28] placeholder-[#B8AE9A] resize-none"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={saving || !form.client_id || !form.name}
          className="mt-5 w-full bg-[#FF6B2B] text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-[#E85A1A] transition-colors disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create Project"}
        </button>
      </div>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const meta = STATUS_META[project.status];
  const deliverables = project.deliverables ?? [];
  const done = deliverables.filter((d) => d.done).length;
  const pct = deliverables.length > 0 ? Math.round((done / deliverables.length) * 100) : null;

  const days = project.deadline ? daysUntil(project.deadline) : null;
  const overdue = days !== null && days < 0;
  const urgent  = days !== null && days >= 0 && days <= 3;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-xl border border-[#EAE4D8] p-5 hover:border-[#D4CCBC] hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-[#B8AE9A] mb-1">{project.client?.name ?? "—"}</p>
            <h3 className="font-semibold text-[#2C2A28] leading-tight group-hover:text-[#FF6B2B] transition-colors">
              {project.name}
            </h3>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${meta.bg}`}>
            {meta.label}
          </span>
        </div>

        {project.type && (
          <p className="text-xs text-[#6B5F50] mb-3">{TYPE_LABELS[project.type]}</p>
        )}

        {/* Progress bar */}
        {pct !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-[#B8AE9A] mb-1">
              <span>Deliverables</span>
              <span>{done}/{deliverables.length}</span>
            </div>
            <div className="h-1.5 bg-[#EAE4D8] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#2D7D46" : "#FF6B2B" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {project.value && (
              <span className="flex items-center gap-1 text-xs font-mono text-[#6B5F50]">
                <DollarSign size={11} />
                {project.value.toLocaleString()}
                {project.paid && <span className="text-[#2D7D46] ml-1">✓</span>}
              </span>
            )}
            {days !== null && (
              <span className={`flex items-center gap-1 text-xs font-mono ${
                overdue ? "text-[#C0392B]" : urgent ? "text-[#C97B20]" : "text-[#B8AE9A]"
              }`}>
                <Calendar size={11} />
                {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
              </span>
            )}
          </div>
          <ChevronRight size={15} className="text-[#D4CCBC] group-hover:text-[#FF6B2B] transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    const [{ data: pData }, { data: cData }] = await Promise.all([
      supabase
        .from("projects")
        .select("*, client:clients(id,name,source,mrr_status)")
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);
    setProjects((pData as Project[]) ?? []);
    setClients((cData as Client[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "active"
    ? projects.filter((p) => ACTIVE_STATUSES.includes(p.status))
    : projects;

  const activeCount    = projects.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;
  const overdueCount   = projects.filter((p) => p.deadline && daysUntil(p.deadline) < 0 && p.status !== "delivered").length;
  const unpaidValue    = projects
    .filter((p) => !p.paid && p.value && p.status !== "cancelled")
    .reduce((sum, p) => sum + (p.value ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#B8AE9A]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active",       value: activeCount,                        color: "#FF6B2B" },
          { label: "Overdue",      value: overdueCount,                       color: overdueCount > 0 ? "#C0392B" : "#B8AE9A" },
          { label: "Unpaid ($)",   value: `$${unpaidValue.toLocaleString()}`, color: "#2D7D46" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#EAE4D8] px-5 py-4">
            <p className="text-xs text-[#B8AE9A] uppercase tracking-wider mb-1">{label}</p>
            <p className="headline text-[28px]" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white border border-[#EAE4D8] rounded-lg p-1 gap-1">
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-[#FF6B2B] text-white" : "text-[#6B5F50] hover:text-[#2C2A28]"
              }`}
            >
              {f === "active" ? `Active (${activeCount})` : `All (${projects.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-[#FF6B2B] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#E85A1A] transition-colors"
        >
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-[#B8AE9A]">
          <p className="text-sm">No projects yet — create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showNew && (
        <NewProjectModal clients={clients} onClose={() => setShowNew(false)} onCreated={load} />
      )}
    </div>
  );
}
