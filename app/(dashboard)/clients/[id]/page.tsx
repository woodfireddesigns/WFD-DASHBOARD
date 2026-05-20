"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, Client, Project, ProjectStatus } from "@/lib/supabase";
import { ArrowLeft, Mail, Phone, Save, ExternalLink, Loader2 } from "lucide-react";

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  discovery: { label: "Discovery", color: "#1E5FAA", bg: "#EEF4FF" },
  design:    { label: "Design",    color: "#B86B10", bg: "#FEF3E2" },
  build:     { label: "Build",     color: "#FF6B2B", bg: "#FFF3EE" },
  review:    { label: "Review",    color: "#6B6560", bg: "#F0EBE1" },
  delivered: { label: "Delivered", color: "#1E7A3C", bg: "#ECFBF0" },
  paused:    { label: "Paused",    color: "#A09890", bg: "#F8F5F0" },
  cancelled: { label: "Cancelled", color: "#B83232", bg: "#FEE8E8" },
};

const SOURCE_LABELS: Record<string, string> = {
  outreach: "Outreach", referral: "Referral", instagram: "Instagram",
  contra: "Contra", website: "Website", word_of_mouth: "Word of Mouth",
  dallas: "Dallas", other: "Other",
};

const TIER_LABELS: Record<string, string> = {
  brand_foundation: "Brand Foundation", conversion_website: "Conversion Website",
  brand_web_bundle: "Brand + Web Bundle", ai_photography: "AI Photography",
  brand_content_system: "Brand Content System", one_off: "One-Off",
};

const S = {
  fieldLabel: { display: "block", fontSize: 10.5, fontWeight: 500, color: "#A09890", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4 },
  fieldInput: { width: "100%", fontSize: 13, borderBottom: "1px solid #E8E2D8", padding: "5px 0", outline: "none", background: "transparent", color: "#1E1C1A", fontFamily: "Inter, sans-serif", transition: "border-color 0.15s" },
  select: { width: "100%", fontSize: 13, borderBottom: "1px solid #E8E2D8", padding: "5px 0", outline: "none", background: "transparent", color: "#1E1C1A" },
  card: { backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, padding: "18px 20px" } as React.CSSProperties,
};

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={S.fieldLabel}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={S.fieldInput}
        onFocus={(e) => (e.target.style.borderColor = "#FF6B2B")}
        onBlur={(e) => (e.target.style.borderColor = "#E8E2D8")} />
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", contact_name: "", email: "", phone: "", city: "", state: "", notes: "", mrr_status: "none", mrr_amount: "0", source: "", tier: "" });

  const load = useCallback(async () => {
    const [{ data: cData }, { data: pData }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    ]);
    if (cData) {
      const c = cData as Client;
      setClient(c);
      setForm({ name: c.name ?? "", contact_name: c.contact_name ?? "", email: c.email ?? "", phone: c.phone ?? "", city: c.city ?? "", state: c.state ?? "", notes: c.notes ?? "", mrr_status: c.mrr_status ?? "none", mrr_amount: String(c.mrr_amount ?? 0), source: c.source ?? "", tier: c.tier ?? "" });
    }
    setProjects((pData as Project[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })); setDirty(true); }

  async function save() {
    setSaving(true);
    await supabase.from("clients").update({ name: form.name, contact_name: form.contact_name || null, email: form.email || null, phone: form.phone || null, city: form.city || null, state: form.state || null, notes: form.notes || null, mrr_status: form.mrr_status, mrr_amount: parseInt(form.mrr_amount) || 0, source: form.source || null, tier: form.tier || null }).eq("id", id);
    setDirty(false); setSaving(false);
  }

  async function archive() {
    if (!confirm("Archive this client?")) return;
    await supabase.from("clients").update({ is_active: false, archived_at: new Date().toISOString() }).eq("id", id);
    router.push("/clients");
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 80, color: "#A09890" }}>
      <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );
  if (!client) return <div style={{ fontSize: 13, color: "#A09890", paddingTop: 40 }}>Client not found.</div>;

  const totalValue   = projects.reduce((s, p) => s + (p.value ?? 0), 0);
  const paidValue    = projects.filter((p) => p.paid).reduce((s, p) => s + (p.value ?? 0), 0);
  const activeCount  = projects.filter((p) => ["discovery","design","build","review"].includes(p.status)).length;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Back + header */}
      <div>
        <Link href="/clients">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#A09890", marginBottom: 16, cursor: "pointer" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#6B6560")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#A09890")}>
            <ArrowLeft size={13} /> All Clients
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#1E1C1A", color: "#fff", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {form.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: 28, color: "#1E1C1A" }}>{form.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                {form.source && <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#A09890" }}>{SOURCE_LABELS[form.source] ?? form.source}</span>}
                <span style={{
                  fontSize: 10.5, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
                  backgroundColor: form.mrr_status === "active" ? "#ECFBF0" : form.mrr_status === "churned" ? "#FEE8E8" : "#F0EBE1",
                  color: form.mrr_status === "active" ? "#1E7A3C" : form.mrr_status === "churned" ? "#B83232" : "#A09890",
                }}>
                  {form.mrr_status === "active" ? `Retainer · $${parseInt(form.mrr_amount || "0").toLocaleString()}/mo` : form.mrr_status === "churned" ? "Churned" : "Project Client"}
                </span>
              </div>
            </div>
          </div>

          {dirty && (
            <button onClick={save} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600, opacity: saving ? 0.7 : 1, flexShrink: 0 }}>
              <Save size={13} /> {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Projects",    value: projects.length, color: "#1E1C1A" },
          { label: "Active",      value: activeCount,     color: "#FF6B2B" },
          { label: "Total Value", value: `$${totalValue.toLocaleString()}`, color: "#1E1C1A" },
          { label: "Collected",   value: `$${paidValue.toLocaleString()}`, color: "#1E7A3C" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ fontSize: 10, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</p>
            <p className="font-display" style={{ fontSize: 22, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        {/* Left — editable */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Contact */}
          <div style={S.card}>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Contact</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Business Name" value={form.name}         onChange={(v) => update("name", v)} />
              <Field label="Contact"       value={form.contact_name} onChange={(v) => update("contact_name", v)} />
              <Field label="Email"         value={form.email}        onChange={(v) => update("email", v)} />
              <Field label="Phone"         value={form.phone}        onChange={(v) => update("phone", v)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="City"  value={form.city}  onChange={(v) => update("city", v)} />
                <Field label="State" value={form.state} onChange={(v) => update("state", v)} />
              </div>
            </div>
            {(form.email || form.phone) && (
              <div style={{ display: "flex", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid #E8E2D8" }}>
                {form.email && (
                  <a href={`mailto:${form.email}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#FF6B2B", textDecoration: "none" }}>
                    <Mail size={12} /> Email
                  </a>
                )}
                {form.phone && (
                  <a href={`tel:${form.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B6560", textDecoration: "none" }}>
                    <Phone size={12} /> Call
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Relationship */}
          <div style={S.card}>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Relationship</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.fieldLabel}>Source</label>
                <select value={form.source} onChange={(e) => update("source", e.target.value)} style={S.select}>
                  <option value="">—</option>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={S.fieldLabel}>Tier</label>
                <select value={form.tier} onChange={(e) => update("tier", e.target.value)} style={S.select}>
                  <option value="">—</option>
                  {Object.entries(TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={S.fieldLabel}>MRR Status</label>
                <select value={form.mrr_status} onChange={(e) => update("mrr_status", e.target.value)} style={S.select}>
                  <option value="none">No retainer</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
              {form.mrr_status === "active" && (
                <Field label="Monthly ($)" value={form.mrr_amount} onChange={(v) => update("mrr_amount", v)} />
              )}
            </div>
          </div>

          {/* Notes */}
          <div style={S.card}>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Notes</p>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} placeholder="Working style, preferences, context…"
              style={{ width: "100%", fontSize: 13, border: "none", outline: "none", resize: "none", background: "transparent", color: "#1E1C1A", fontFamily: "Inter, sans-serif", lineHeight: 1.6, color: "#6B6560" } as React.CSSProperties} />
          </div>

          <button onClick={archive} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "#C8C0B8", textAlign: "left", padding: "0 4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#B83232")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C8C0B8")}>
            Archive client
          </button>
        </div>

        {/* Right — projects */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em" }}>Projects</p>
            <Link href="/projects">
              <span style={{ fontSize: 12, color: "#FF6B2B", cursor: "pointer" }}>+ New project</span>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div style={{ backgroundColor: "#fff", border: "1px dashed #E8E2D8", borderRadius: 10, padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#C8C0B8" }}>No projects yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {projects.map((p) => {
                const meta = STATUS_META[p.status];
                const deliverables = p.deliverables ?? [];
                const done = deliverables.filter((d: { done: boolean }) => d.done).length;
                const pct = deliverables.length > 0 ? Math.round((done / deliverables.length) * 100) : null;

                return (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D9D1C3"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D8"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: pct !== null ? 10 : 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1E1C1A", lineHeight: 1.3 }}>{p.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                          <ExternalLink size={12} color="#C8C0B8" />
                        </div>
                      </div>
                      {pct !== null && (
                        <div style={{ height: 3, backgroundColor: "#E8E2D8", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: pct === 100 ? "#1E7A3C" : "#FF6B2B", borderRadius: 99, transition: "width 0.3s" }} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {p.value && <span style={{ fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", color: p.paid ? "#1E7A3C" : "#A09890" }}>${p.value.toLocaleString()}{p.paid ? " ✓" : ""}</span>}
                        {p.deadline && <span style={{ fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", color: "#A09890" }}>Due {new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                        {deliverables.length > 0 && <span style={{ fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", color: "#A09890", marginLeft: "auto" }}>{done}/{deliverables.length}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
