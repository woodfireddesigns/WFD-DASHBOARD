"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, Project, ProjectStatus, ProjectType, Deliverable } from "@/lib/supabase";
import { ArrowLeft, Plus, Check, Trash2, Save, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_META: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  discovery: { label: "Discovery", bg: "bg-blue-50",        color: "text-[#2B6CB0]" },
  design:    { label: "Design",    bg: "bg-orange-50",      color: "text-[#C97B20]" },
  build:     { label: "Build",     bg: "bg-orange-100",     color: "text-[#FF6B2B]" },
  review:    { label: "Review",    bg: "bg-[#EAE4D8]",      color: "text-[#6B5F50]" },
  delivered: { label: "Delivered", bg: "bg-green-50",       color: "text-[#2D7D46]" },
  paused:    { label: "Paused",    bg: "bg-[#F5F0E8]",      color: "text-[#B8AE9A]" },
  cancelled: { label: "Cancelled", bg: "bg-red-50",         color: "text-[#C0392B]" },
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

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, client:clients(id,name,email,phone,contact_name,source,mrr_status)")
      .eq("id", id)
      .single();
    if (data) {
      setProject(data as Project);
      setEditNotes(data.notes ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: ProjectStatus) {
    setProject((p) => p ? { ...p, status } : p);
    await supabase.from("projects").update({ status }).eq("id", id);
  }

  async function togglePaid() {
    const next = !project?.paid;
    setProject((p) => p ? { ...p, paid: next } : p);
    await supabase.from("projects").update({ paid: next }).eq("id", id);
  }

  async function saveNotes() {
    setSaving(true);
    await supabase.from("projects").update({ notes: editNotes }).eq("id", id);
    setProject((p) => p ? { ...p, notes: editNotes } : p);
    setNotesDirty(false);
    setSaving(false);
  }

  async function addDeliverable() {
    if (!newDeliverable.trim() || !project) return;
    const next: Deliverable[] = [
      ...(project.deliverables ?? []),
      { id: uid(), text: newDeliverable.trim(), done: false },
    ];
    setProject({ ...project, deliverables: next });
    setNewDeliverable("");
    await supabase.from("projects").update({ deliverables: next }).eq("id", id);
  }

  async function toggleDeliverable(did: string) {
    if (!project) return;
    const next = project.deliverables.map((d) =>
      d.id === did ? { ...d, done: !d.done } : d
    );
    setProject({ ...project, deliverables: next });
    await supabase.from("projects").update({ deliverables: next }).eq("id", id);
  }

  async function removeDeliverable(did: string) {
    if (!project) return;
    const next = project.deliverables.filter((d) => d.id !== did);
    setProject({ ...project, deliverables: next });
    await supabase.from("projects").update({ deliverables: next }).eq("id", id);
  }

  async function deleteProject() {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await supabase.from("projects").delete().eq("id", id);
    router.push("/projects");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#B8AE9A]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!project) {
    return <div className="text-[#B8AE9A] py-10 text-sm">Project not found.</div>;
  }

  const meta = STATUS_META[project.status];
  const deliverables = project.deliverables ?? [];
  const doneCount = deliverables.filter((d) => d.done).length;
  const pct = deliverables.length > 0 ? Math.round((doneCount / deliverables.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/projects" className="flex items-center gap-1.5 text-sm text-[#B8AE9A] hover:text-[#6B5F50] mb-4 transition-colors w-fit">
          <ArrowLeft size={14} /> All Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[#B8AE9A] mb-1">{project.client?.name ?? "—"}</p>
            <h1 className="headline text-[32px] text-[#2C2A28]">{project.name}</h1>
            {project.type && (
              <p className="text-sm text-[#6B5F50] mt-1">{TYPE_LABELS[project.type]}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
            {project.value && (
              <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                project.paid ? "bg-green-50 text-[#2D7D46]" : "bg-[#EAE4D8] text-[#6B5F50]"
              }`}>
                ${project.value.toLocaleString()}{project.paid ? " ✓ paid" : " unpaid"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left col — status + meta */}
        <div className="space-y-4">
          {/* Status selector */}
          <div className="bg-white rounded-xl border border-[#EAE4D8] p-4">
            <p className="text-xs font-medium text-[#B8AE9A] uppercase tracking-wider mb-3">Status</p>
            <div className="space-y-1">
              {(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => {
                const m = STATUS_META[s];
                const active = project.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium ${
                      active ? `${m.bg} ${m.color}` : "text-[#B8AE9A] hover:bg-[#F5F0E8] hover:text-[#6B5F50]"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-xl border border-[#EAE4D8] p-4 space-y-3">
            <p className="text-xs font-medium text-[#B8AE9A] uppercase tracking-wider">Details</p>
            {project.deadline && (
              <div>
                <p className="text-[10px] text-[#B8AE9A] mb-0.5">Deadline</p>
                <p className="text-sm font-mono text-[#2C2A28]">
                  {new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            {project.value && (
              <div>
                <p className="text-[10px] text-[#B8AE9A] mb-0.5">Value</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-[#2C2A28]">${project.value.toLocaleString()}</p>
                  <button
                    onClick={togglePaid}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      project.paid
                        ? "bg-[#2D7D46] text-white"
                        : "bg-[#EAE4D8] text-[#6B5F50] hover:bg-[#D4CCBC]"
                    }`}
                  >
                    {project.paid ? "Paid ✓" : "Mark Paid"}
                  </button>
                </div>
              </div>
            )}
            {project.client && (
              <div>
                <p className="text-[10px] text-[#B8AE9A] mb-0.5">Client</p>
                <Link href={`/clients/${project.client_id}`} className="text-sm text-[#FF6B2B] hover:underline">
                  {project.client.name}
                </Link>
              </div>
            )}
            <div className="pt-2 border-t border-[#EAE4D8]">
              <button
                onClick={deleteProject}
                className="text-xs text-[#C0392B] hover:text-[#922B21] transition-colors"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>

        {/* Right col — deliverables + notes */}
        <div className="md:col-span-2 space-y-4">
          {/* Deliverables */}
          <div className="bg-white rounded-xl border border-[#EAE4D8] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-[#B8AE9A] uppercase tracking-wider">Deliverables</p>
              {deliverables.length > 0 && (
                <span className="text-xs font-mono text-[#6B5F50]">{doneCount}/{deliverables.length} — {pct}%</span>
              )}
            </div>

            {/* Progress bar */}
            {deliverables.length > 0 && (
              <div className="h-1.5 bg-[#EAE4D8] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#2D7D46" : "#FF6B2B" }}
                />
              </div>
            )}

            <div className="space-y-1.5 mb-3">
              {deliverables.length === 0 && (
                <p className="text-sm text-[#D4CCBC] py-2">No deliverables yet.</p>
              )}
              {deliverables.map((d) => (
                <div key={d.id} className="flex items-center gap-3 group py-1">
                  <button
                    onClick={() => toggleDeliverable(d.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      d.done ? "bg-[#2D7D46] border-[#2D7D46]" : "border-[#D4CCBC] hover:border-[#FF6B2B]"
                    }`}
                  >
                    {d.done && <Check size={12} strokeWidth={3} className="text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${d.done ? "line-through text-[#B8AE9A]" : "text-[#2C2A28]"}`}>
                    {d.text}
                  </span>
                  <button
                    onClick={() => removeDeliverable(d.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#D4CCBC] hover:text-[#C0392B] transition-all"
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
                className="flex-1 text-sm border border-[#EAE4D8] rounded-lg px-3 py-2 outline-none focus:border-[#FF6B2B] bg-[#F5F0E8] text-[#2C2A28] placeholder-[#B8AE9A]"
              />
              <button
                onClick={addDeliverable}
                className="px-3 py-2 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E85A1A] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-[#EAE4D8] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[#B8AE9A] uppercase tracking-wider">Notes</p>
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
              className="w-full text-sm text-[#2C2A28] placeholder-[#D4CCBC] outline-none resize-none bg-transparent leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
