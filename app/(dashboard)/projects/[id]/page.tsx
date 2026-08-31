"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, Project, ProjectStatus, ProjectType, BillingType, BlockedOn, Deliverable } from "@/lib/supabase";
import { ArrowLeft, Plus, Check, Trash2, Save, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_META: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  discovery: { label: "Discovery", bg: "bg-[#16222E]",        color: "text-[#5B9BD5]" },
  design:    { label: "Design",    bg: "bg-[#2A1D12]",      color: "text-[#E8A33D]" },
  build:     { label: "Build",     bg: "bg-[#33200F]",     color: "text-[#FF6B2B]" },
  review:    { label: "Review",    bg: "bg-[#1E1A16]",      color: "text-[#C4B8AE]" },
  delivered: { label: "Delivered", bg: "bg-[#12241A]",       color: "text-[#3FB86B]" },
  paused:    { label: "Paused",    bg: "bg-[#1E1A16]",      color: "text-[#8F827A]" },
  cancelled: { label: "Cancelled", bg: "bg-[#2A1614]",         color: "text-[#E2564A]" },
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

interface ClientOption { id: string; name: string }

function uid() { return Math.random().toString(36).slice(2, 9); }

const FIELD =
  "w-full text-sm border border-[#2A241E] rounded-lg px-2.5 py-1.5 outline-none " +
  "focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8] placeholder-[#6B5F57]";
const FIELD_LABEL = "text-[10px] text-[#8F827A] mb-1 block";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [copiedKickoff, setCopiedKickoff] = useState(false);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadErr } = await supabase
      .from("projects")
      .select("*, client:clients(id,name,email,phone,contact_name,source,mrr_status)")
      .eq("id", id)
      .single();

    if (loadErr) setError(loadErr.message);
    if (data) {
      setProject(data as Project);
      setEditNotes(data.notes ?? "");
      setTitle(data.name ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase
      .from("clients")
      .select("id,name")
      .order("name")
      .then(({ data }) => setClients((data as ClientOption[]) ?? []));
  }, []);

  /**
   * Every write to the project goes through here.
   *
   * Updates optimistically, then rolls back and says what went wrong if the
   * write is refused. The page used to fire updates and discard the result, so
   * a rejected write looked exactly like a successful one -- the row on screen
   * changed and the database did not.
   */
  const patch = useCallback(
    async (fields: Partial<Project>) => {
      if (!project) return;
      const previous = project;
      setProject({ ...project, ...fields } as Project);
      setError(null);

      const { error: updateErr } = await supabase.from("projects").update(fields).eq("id", id);

      if (updateErr) {
        setProject(previous);
        setError(`Could not save: ${updateErr.message}`);
      }
    },
    [project, id]
  );

  async function saveNotes() {
    setSaving(true);
    const { error: notesErr } = await supabase.from("projects").update({ notes: editNotes }).eq("id", id);
    if (notesErr) {
      setError(`Could not save notes: ${notesErr.message}`);
    } else {
      setProject((p) => (p ? { ...p, notes: editNotes } : p));
      setNotesDirty(false);
    }
    setSaving(false);
  }

  function commitTitle() {
    const next = title.trim();
    if (!project || next === "" || next === project.name) {
      setTitle(project?.name ?? "");
      return;
    }
    patch({ name: next });
  }

  function setDeliverables(next: Deliverable[]) {
    patch({ deliverables: next });
  }

  function addDeliverable() {
    if (!newDeliverable.trim() || !project) return;
    setDeliverables([
      ...(project.deliverables ?? []),
      { id: uid(), text: newDeliverable.trim(), done: false },
    ]);
    setNewDeliverable("");
  }

  function editDeliverable(did: string, text: string) {
    if (!project) return;
    setDeliverables(
      project.deliverables.map((d) => (d.id === did ? { ...d, text } : d))
    );
  }

  async function deleteProject() {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error: delErr } = await supabase.from("projects").delete().eq("id", id);
    if (delErr) {
      setError(`Could not delete: ${delErr.message}`);
      return;
    }
    router.push("/projects");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#8F827A]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!project) {
    return <div className="text-[#8F827A] py-10 text-sm">Project not found.</div>;
  }

  const meta = STATUS_META[project.status];
  const deliverables = project.deliverables ?? [];
  const doneCount = deliverables.filter((d) => d.done).length;
  const pct = deliverables.length > 0 ? Math.round((doneCount / deliverables.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        {/* Hover brightens. It darkened to #C4B8AE before, which on this dark
            ground made the link recede exactly when it should respond. */}
        <Link href="/projects" className="flex items-center gap-1.5 text-sm text-[#8F827A] hover:text-[#F2EDE8] mb-4 transition-colors w-fit">
          <ArrowLeft size={14} /> All Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-[#8F827A] mb-1">{project.client?.name ?? "—"}</p>
            {/* Always an input, styled as the heading, rather than a
                click-to-edit mode. No colour class: this sits on the dark page
                ground, not inside a cream card, so it inherits #F2EDE8. */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") { setTitle(project.name); e.currentTarget.blur(); }
              }}
              aria-label="Project name"
              className="headline text-[32px] text-[#F2EDE8] w-full bg-transparent outline-none
                         border-b border-transparent hover:border-[#3A352E] focus:border-[#FF6B2B]
                         transition-colors"
            />
            {/* #C4B8AE on the dark ground was about 2:1 contrast. #8F827A
                matches the client name above it and stays legible. */}
            {project.type && (
              <p className="text-sm text-[#8F827A] mt-1">{TYPE_LABELS[project.type]}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
            {project.value !== null && project.value > 0 && (
              <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                project.billing_type === "retainer"
                  ? "bg-[#12241A] text-[#3FB86B]"
                  : project.paid ? "bg-[#12241A] text-[#3FB86B]" : "bg-[#1E1A16] text-[#C4B8AE]"
              }`}>
                ${project.value.toLocaleString()}
                {/* A retainer is never "paid" — it recurs. Saying unpaid here was
                    the same mistake the old top bar made, one card at a time. */}
                {project.billing_type === "retainer" ? "/mo" : project.paid ? " ✓ paid" : " unpaid"}
              </span>
            )}
          </div>
        </div>
      </div>

      {error !== null && (
        <div role="alert" className="flex items-start justify-between gap-4 bg-[#2A1614] border border-[#E2564A] rounded-lg px-4 py-3">
          <p className="text-sm text-[#922B21]">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-[#922B21] hover:underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left col — status + meta */}
        <div className="space-y-4">
          {/* Status selector */}
          <div className="bg-[#161310] rounded-xl border border-[#2A241E] p-4">
            <p className="text-xs font-medium text-[#8F827A] uppercase tracking-wider mb-3">Status</p>
            <div className="space-y-1">
              {(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => {
                const m = STATUS_META[s];
                const active = project.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => patch({ status: s })}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium ${
                      active ? `${m.bg} ${m.color}` : "text-[#8F827A] hover:bg-[#1E1A16] hover:text-[#C4B8AE]"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details — every field renders whether or not it has a value, so an
              empty one can be filled in. Guarding these on truthiness meant a
              project with no deadline could never be given one. */}
          <div className="bg-[#161310] rounded-xl border border-[#2A241E] p-4 space-y-3">
            <p className="text-xs font-medium text-[#8F827A] uppercase tracking-wider">Details</p>

            <div>
              <label htmlFor="type" className={FIELD_LABEL}>Type</label>
              <select
                id="type"
                value={project.type ?? ""}
                onChange={(e) => patch({ type: (e.target.value || null) as ProjectType | null })}
                className={FIELD}
              >
                <option value="">Not set</option>
                {(Object.keys(TYPE_LABELS) as ProjectType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className={FIELD_LABEL}>Deadline</label>
              <input
                id="deadline"
                type="date"
                value={project.deadline ? project.deadline.slice(0, 10) : ""}
                onChange={(e) => patch({ deadline: e.target.value || null })}
                className={FIELD}
              />
            </div>

            <div>
              <label htmlFor="billing_type" className={FIELD_LABEL}>Billing</label>
              <select
                id="billing_type"
                value={project.billing_type}
                onChange={(e) => patch({ billing_type: e.target.value as BillingType })}
                className={FIELD}
              >
                <option value="one_time">One-time — fixed contract</option>
                <option value="retainer">Retainer — per month</option>
              </select>
            </div>

            <div>
              <label htmlFor="value" className={FIELD_LABEL}>
                {project.billing_type === "retainer" ? "Monthly amount" : "Value"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="value"
                  type="number"
                  min={0}
                  step={1}
                  value={project.value ?? ""}
                  onChange={(e) => patch({ value: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="0"
                  className={FIELD}
                />
                {project.billing_type === "one_time" && (
                  <button
                    onClick={() => patch({ paid: !project.paid })}
                    className={`text-[10px] font-semibold px-2 py-1.5 rounded shrink-0 transition-colors ${
                      project.paid
                        ? "bg-[#3FB86B] text-white"
                        : "bg-[#1E1A16] text-[#C4B8AE] hover:bg-[#3A322A]"
                    }`}
                  >
                    {project.paid ? "Paid ✓" : "Mark Paid"}
                  </button>
                )}
              </div>
            </div>

            {/* Money and blockers. These two feed the Projects header directly —
                this is where "To Invoice" and "Needs You" actually get set. */}
            <div>
              <label htmlFor="to_invoice" className={FIELD_LABEL}>Ready to invoice ($)</label>
              <input
                id="to_invoice"
                type="number"
                min={0}
                step={1}
                value={project.to_invoice || ""}
                onChange={(e) => patch({ to_invoice: e.target.value === "" ? 0 : Number(e.target.value) })}
                placeholder="0"
                className={FIELD}
              />
              <input
                aria-label="What the invoice is for"
                type="text"
                defaultValue={project.to_invoice_note ?? ""}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next !== (project.to_invoice_note ?? "")) patch({ to_invoice_note: next || null });
                }}
                placeholder="What it's for — e.g. M1 design sign-off"
                className={`${FIELD} mt-1.5`}
              />
            </div>

            <div>
              <label htmlFor="blocked_on" className={FIELD_LABEL}>Waiting on</label>
              <select
                id="blocked_on"
                value={project.blocked_on ?? ""}
                onChange={(e) => patch({ blocked_on: (e.target.value || null) as BlockedOn | null })}
                className={FIELD}
              >
                <option value="">Nothing — it&apos;s moving</option>
                <option value="me">You</option>
                <option value="client">The client</option>
              </select>
              {project.blocked_on && (
                <input
                  aria-label="What it is waiting on"
                  type="text"
                  defaultValue={project.blocked_note ?? ""}
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next !== (project.blocked_note ?? "")) patch({ blocked_note: next || null });
                  }}
                  placeholder="What exactly — e.g. DNS access"
                  className={`${FIELD} mt-1.5`}
                />
              )}
            </div>

            <div>
              <label className={FIELD_LABEL}>Kickoff link</label>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/kickoff?p=${project.id}`;
                  navigator.clipboard.writeText(url)
                    .then(() => { setCopiedKickoff(true); setTimeout(() => setCopiedKickoff(false), 1600); })
                    .catch(() => {});
                }}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                  copiedKickoff
                    ? "border-[#3FB86B] bg-[#12241A] text-[#3FB86B]"
                    : "border-[#2A241E] bg-[#1E1A16] text-[#C4B8AE] hover:border-[#3A322A]"
                }`}
              >
                {copiedKickoff ? "Copied — send it to them" : "Copy kickoff link"}
              </button>
              <p className="text-[11px] text-[#8F827A] mt-1 leading-relaxed">
                Collects DNS access, brand files and who signs off. Answers append to the notes below.
              </p>
            </div>

            <div>
              <label htmlFor="client" className={FIELD_LABEL}>Client</label>
              <select
                id="client"
                value={project.client_id ?? ""}
                onChange={(e) => patch({ client_id: e.target.value })}
                className={FIELD}
              >
                <option value="">Not set</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {project.client && (
                <Link
                  href={`/clients/${project.client_id}`}
                  className="text-xs text-[#FF6B2B] hover:underline mt-1 inline-block"
                >
                  Open client
                </Link>
              )}
            </div>

            <div className="pt-2 border-t border-[#2A241E]">
              <button
                onClick={deleteProject}
                className="text-xs text-[#E2564A] hover:text-[#922B21] transition-colors"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>

        {/* Right col — deliverables + notes */}
        <div className="md:col-span-2 space-y-4">
          {/* Deliverables */}
          <div className="bg-[#161310] rounded-xl border border-[#2A241E] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-[#8F827A] uppercase tracking-wider">Deliverables</p>
              {deliverables.length > 0 && (
                <span className="text-xs font-mono text-[#C4B8AE]">{doneCount}/{deliverables.length} — {pct}%</span>
              )}
            </div>

            {/* Progress bar */}
            {deliverables.length > 0 && (
              <div className="h-1.5 bg-[#1E1A16] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#3FB86B" : "#FF6B2B" }}
                />
              </div>
            )}

            <div className="space-y-1.5 mb-3">
              {deliverables.length === 0 && (
                <p className="text-sm text-[#8F827A] py-2">No deliverables yet.</p>
              )}
              {deliverables.map((d) => (
                <div key={d.id} className="flex items-center gap-3 group py-1">
                  <button
                    onClick={() =>
                      setDeliverables(
                        deliverables.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x))
                      )
                    }
                    aria-label={d.done ? "Mark not done" : "Mark done"}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      d.done ? "bg-[#3FB86B] border-[#3FB86B]" : "border-[#3A322A] hover:border-[#FF6B2B]"
                    }`}
                  >
                    {d.done && <Check size={12} strokeWidth={3} className="text-white" />}
                  </button>
                  {/* Editable in place. Previously a deliverable could only be
                      added or deleted, so fixing a typo meant retyping it. */}
                  <input
                    defaultValue={d.text}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next !== "" && next !== d.text) editDeliverable(d.id, next);
                      else e.target.value = d.text;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") { e.currentTarget.value = d.text; e.currentTarget.blur(); }
                    }}
                    aria-label="Deliverable"
                    className={`text-sm flex-1 bg-transparent outline-none border-b border-transparent
                                hover:border-[#2A241E] focus:border-[#FF6B2B] transition-colors ${
                      d.done ? "line-through text-[#8F827A]" : "text-[#F2EDE8]"
                    }`}
                  />
                  <button
                    onClick={() => setDeliverables(deliverables.filter((x) => x.id !== d.id))}
                    aria-label="Remove deliverable"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#8F827A] hover:text-[#E2564A] transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add deliverable */}
            <div className="flex gap-2">
              <input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addDeliverable(); }}
                placeholder="Add deliverable…"
                className="flex-1 text-sm border border-[#2A241E] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#1E1A16] text-[#F2EDE8] placeholder-[#6B5F57]"
              />
              <button
                onClick={addDeliverable}
                aria-label="Add deliverable"
                className="px-3 py-2 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E85A1A] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#161310] rounded-xl border border-[#2A241E] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[#8F827A] uppercase tracking-wider">Notes</p>
              {notesDirty && (
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs bg-[#FF6B2B] text-white px-3 py-1 rounded-lg hover:bg-[#E85A1A] transition-colors"
                >
                  <Save size={12} /> {saving ? "Saving…" : "Save"}
                </button>
              )}
            </div>
            <textarea
              value={editNotes}
              onChange={(e) => { setEditNotes(e.target.value); setNotesDirty(true); }}
              rows={5}
              placeholder="Project notes, brief details, client feedback…"
              className="w-full text-sm text-[#F2EDE8] placeholder-[#3A322A] outline-none resize-none bg-transparent leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
