"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, Project, Client, ProjectStatus, ProjectType, BillingType, Deliverable } from "@/lib/supabase";
import { Plus, X, ChevronRight, Calendar, DollarSign, Loader2, Repeat, AlertCircle, Clock } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  discovery: { label: "Discovery",  color: "#5B9BD5", bg: "bg-[#16222E] text-[#5B9BD5]" },
  design:    { label: "Design",     color: "#E8A33D", bg: "bg-[#2A1D12] text-[#E8A33D]" },
  build:     { label: "Build",      color: "#FF6B2B", bg: "bg-[#33200F] text-[#FF6B2B]" },
  review:    { label: "Review",     color: "#C4B8AE", bg: "bg-[#1E1A16] text-[#C4B8AE]" },
  delivered: { label: "Delivered",  color: "#3FB86B", bg: "bg-[#12241A] text-[#3FB86B]" },
  paused:    { label: "Paused",     color: "#8F827A", bg: "bg-[#1E1A16] text-[#8F827A]" },
  cancelled: { label: "Cancelled",  color: "#E2564A", bg: "bg-[#2A1614] text-[#E2564A]" },
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
    billing_type: "one_time" as BillingType,
    deadline: "",
    value: "",
    notes: "",
  });
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const isNewClient = form.client_id === "__new__";

  async function submit() {
    if (!form.name) return;
    if (!isNewClient && !form.client_id) return;
    setSaving(true);

    let clientId = form.client_id;

    if (isNewClient) {
      if (!newClient.name.trim()) { setSaving(false); return; }
      const { data: created } = await supabase
        .from("clients")
        .insert({ name: newClient.name.trim(), email: newClient.email || null, phone: newClient.phone || null, is_active: true, mrr_status: "none", mrr_amount: 0, source: "other" })
        .select().single();
      clientId = created?.id ?? "";
    }

    await supabase.from("projects").insert({
      client_id: clientId || null,
      name: form.name,
      type: form.type,
      status: form.status,
      billing_type: form.billing_type,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060504]/75 backdrop-blur-sm">
      <div className="bg-[#161310] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="headline text-[20px] text-[#F2EDE8]">New Project</h2>
          <button onClick={onClose} className="text-[#8F827A] hover:text-[#C4B8AE]"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8]"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__new__">+ Add new client</option>
            </select>
          </div>

          {/* Inline new client fields */}
          {isNewClient && (
            <div className="rounded-lg border border-[#FF6B2B]/30 bg-[#231A14] p-3 space-y-2">
              <p className="text-xs font-semibold text-[#FF6B2B] uppercase tracking-wide">New Client</p>
              <div>
                <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Name *</label>
                <input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Business or contact name"
                  className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#161310] text-[#F2EDE8] placeholder-[#6B5F57]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Email</label>
                  <input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="email@example.com" type="email"
                    className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#161310] text-[#F2EDE8] placeholder-[#6B5F57]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Phone</label>
                  <input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#161310] text-[#F2EDE8] placeholder-[#6B5F57]" />
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Project Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Brand Identity Refresh"
              className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8] placeholder-[#6B5F57]"
            />
          </div>
          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
                className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8]"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8]"
              >
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Billing — asked here rather than assumed, because it decides whether
              this project's value is a debt or an income line every month. */}
          <div>
            <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Billing</label>
            <div className="flex gap-2">
              {([
                { v: "one_time", label: "One-time", sub: "Fixed contract" },
                { v: "retainer", label: "Retainer", sub: "Per month" },
              ] as const).map(({ v, label, sub }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, billing_type: v })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                    form.billing_type === v
                      ? "border-[#FF6B2B] bg-[#231A14]"
                      : "border-[#2A241E] bg-[#1E1A16] hover:border-[#3A322A]"
                  }`}
                >
                  <span className={`block text-sm font-medium ${form.billing_type === v ? "text-[#FF6B2B]" : "text-[#F2EDE8]"}`}>{label}</span>
                  <span className="block text-[10px] text-[#8F827A]">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Deadline + Value row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C4B8AE] mb-1">
                {form.billing_type === "retainer" ? "Monthly ($)" : "Value ($)"}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.billing_type === "retainer" ? "2000" : "2400"}
                className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8] placeholder-[#6B5F57]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#C4B8AE] mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Any context…"
              className="w-full text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8] placeholder-[#6B5F57] resize-none"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={saving || !form.name || (!form.client_id) || (isNewClient && !newClient.name.trim())}
          className="mt-5 w-full bg-[#FF6B2B] text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-[#E85A1A] transition-colors disabled:opacity-40"
        >
          {saving ? "Creating…" : isNewClient ? "Create Client & Project" : "Create Project"}
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
  const isRetainer = project.billing_type === "retainer";

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-[#161310] rounded-xl border border-[#2A241E] p-5 hover:border-[#3A322A] hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-[#8F827A] mb-1">{project.client?.name ?? "—"}</p>
            <h3 className="font-semibold text-[#F2EDE8] leading-tight group-hover:text-[#FF6B2B] transition-colors">
              {project.name}
            </h3>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${meta.bg}`}>
            {meta.label}
          </span>
        </div>

        {project.type && (
          <p className="text-xs text-[#C4B8AE] mb-3">{TYPE_LABELS[project.type]}</p>
        )}

        {/* Progress bar */}
        {pct !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-[#8F827A] mb-1">
              <span>Deliverables</span>
              <span>{done}/{deliverables.length}</span>
            </div>
            <div className="h-1.5 bg-[#1E1A16] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#3FB86B" : "#FF6B2B" }}
              />
            </div>
          </div>
        )}

        {/* What's holding it. Said plainly, because "blocked" without a name is
            just a feeling — and half these lines are a one-line email away. */}
        {(project.blocked_on || project.to_invoice > 0) && (
          <div className="mb-3 space-y-1.5">
            {project.to_invoice > 0 && (
              <div className="flex items-start gap-1.5 text-[11px] leading-snug text-[#FF6B2B]">
                <DollarSign size={11} className="shrink-0 mt-px" />
                <span>
                  <strong>${project.to_invoice.toLocaleString()} to invoice</strong>
                  {project.to_invoice_note && ` — ${project.to_invoice_note}`}
                </span>
              </div>
            )}
            {project.blocked_on && (
              <div className={`flex items-start gap-1.5 text-[11px] leading-snug ${
                project.blocked_on === "me" ? "text-[#E2564A]" : "text-[#C4B8AE]"
              }`}>
                <AlertCircle size={11} className="shrink-0 mt-px" />
                <span>
                  <strong>{project.blocked_on === "me" ? "On you" : "On them"}</strong>
                  {project.blocked_note && ` — ${project.blocked_note}`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {project.value && (
              <span className="flex items-center gap-1 text-xs font-mono text-[#C4B8AE]">
                {isRetainer ? <Repeat size={11} /> : <DollarSign size={11} />}
                {project.value.toLocaleString()}
                {isRetainer && <span className="text-[#8F827A]">/mo</span>}
                {!isRetainer && project.paid && <span className="text-[#3FB86B] ml-1">✓</span>}
              </span>
            )}
            {days !== null && (
              <span className={`flex items-center gap-1 text-xs font-mono ${
                overdue ? "text-[#E2564A]" : urgent ? "text-[#E8A33D]" : "text-[#8F827A]"
              }`}>
                <Calendar size={11} />
                {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
              </span>
            )}
          </div>
          <ChevronRight size={15} className="text-[#8F827A] group-hover:text-[#FF6B2B] transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

/**
 * A stat is only worth a tile if it changes what you do next. Each one carries a
 * footer naming the specific thing behind the number — "$1,550" tells you
 * nothing, "$1,550 · M1 design sign-off" tells you who to email.
 */
function StatTile({ label, value, color, icon, foot }: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  foot: string;
}) {
  return (
    <div className="bg-[#161310] rounded-xl border border-[#2A241E] px-5 py-4">
      <div className="flex items-center gap-1.5 mb-1" style={{ color: "#8F827A" }}>
        {icon}
        <p className="text-xs uppercase tracking-wider">{label}</p>
      </div>
      <p className="headline text-[28px] leading-none mb-1.5" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#8F827A] leading-snug truncate" title={foot}>{foot}</p>
    </div>
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

  const activeCount = projects.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;

  // Monthly recurring: only live retainers, and only counted once each. The old
  // bar folded these into "Unpaid", which read a $2,000/mo retainer as a $2,000
  // debt — the one number on the page that was reliably wrong.
  const mrr = projects
    .filter((p) => p.billing_type === "retainer" && ACTIVE_STATUSES.includes(p.status))
    .reduce((sum, p) => sum + (p.value ?? 0), 0);

  // To invoice: work delivered but not yet billed. Set per project, because
  // "which milestone cleared" is a judgement call no schema can make for you.
  const toInvoice = projects
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + (p.to_invoice ?? 0), 0);

  // Needs you: parked on Michael, or past its deadline and still open. Overdue
  // used to be its own tile, but an overdue project IS something that needs you
  // — splitting them let a project be urgent in two places and acted on in none.
  const needsYou = projects.filter(
    (p) =>
      ACTIVE_STATUSES.includes(p.status) &&
      (p.blocked_on === "me" || (p.deadline !== null && daysUntil(p.deadline) < 0))
  );
  const waitingOnClient = projects.filter(
    (p) => ACTIVE_STATUSES.includes(p.status) && p.blocked_on === "client"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#8F827A]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats — three numbers you can act on, not three numbers you can read */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Monthly Recurring"
          value={`$${mrr.toLocaleString()}`}
          color="#3FB86B"
          icon={<Repeat size={12} />}
          foot={
            mrr > 0
              ? `${projects.filter((p) => p.billing_type === "retainer" && ACTIVE_STATUSES.includes(p.status)).length} retainers · ${activeCount} active projects`
              : `${activeCount} active projects`
          }
        />
        <StatTile
          label="To Invoice"
          value={`$${toInvoice.toLocaleString()}`}
          color={toInvoice > 0 ? "#FF6B2B" : "#8F827A"}
          icon={<DollarSign size={12} />}
          foot={
            toInvoice > 0
              ? projects.find((p) => p.to_invoice > 0)?.to_invoice_note?.split(".")[0] ?? "Delivered, not yet billed"
              : "Nothing sitting unbilled"
          }
        />
        <StatTile
          label="Needs You"
          value={needsYou.length}
          color={needsYou.length > 0 ? "#E2564A" : "#8F827A"}
          icon={needsYou.length > 0 ? <AlertCircle size={12} /> : <Clock size={12} />}
          foot={
            needsYou.length > 0
              ? needsYou.map((p) => p.client?.name ?? p.name).join(" · ")
              : waitingOnClient > 0
                ? `Clear. ${waitingOnClient} waiting on the client.`
                : "Nothing blocked"
          }
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[#161310] border border-[#2A241E] rounded-lg p-1 gap-1">
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-[#FF6B2B] text-white" : "text-[#C4B8AE] hover:text-[#F2EDE8]"
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
        <div className="text-center py-16 text-[#8F827A]">
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
