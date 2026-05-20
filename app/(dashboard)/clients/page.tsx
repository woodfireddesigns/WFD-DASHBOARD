"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, Client } from "@/lib/supabase";
import { Plus, X, Search, ChevronRight, Loader2 } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  outreach: "Outreach", referral: "Referral", instagram: "Instagram",
  contra: "Contra", website: "Website", word_of_mouth: "Word of Mouth",
  dallas: "Dallas", other: "Other",
};

const TIER_LABELS: Record<string, string> = {
  brand_foundation: "Brand Foundation", conversion_website: "Conversion Website",
  brand_web_bundle: "Brand + Web", ai_photography: "AI Photography",
  brand_content_system: "Brand Content", one_off: "One-Off",
};

const S = {
  input: {
    fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8,
    padding: "8px 12px", outline: "none", backgroundColor: "#fff",
    color: "#1E1C1A", fontFamily: "Inter, sans-serif", width: "100%",
  } as React.CSSProperties,
  select: {
    fontSize: 13, border: "1px solid #E8E2D8", borderRadius: 8,
    padding: "8px 12px", outline: "none", backgroundColor: "#F8F5F0",
    color: "#1E1C1A", width: "100%",
  } as React.CSSProperties,
  label: { display: "block", fontSize: 11, fontWeight: 500, color: "#6B6560", marginBottom: 4 } as React.CSSProperties,
};

// ── Add client modal ──────────────────────────────────────────────────────────

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: "", contact_name: "", email: "", phone: "",
    city: "", state: "", source: "other", tier: "",
    mrr_status: "none", mrr_amount: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    await supabase.from("clients").insert({
      name: form.name.trim(),
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      state: form.state || null,
      source: form.source,
      tier: form.tier || null,
      mrr_status: form.mrr_status,
      mrr_amount: form.mrr_amount ? parseInt(form.mrr_amount) : 0,
      notes: form.notes || null,
      is_active: true,
    });
    setSaving(false); onAdded(); onClose();
  }

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(30,28,26,0.55)", backdropFilter: "blur(4px)" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.14)", width: "100%", maxWidth: 440, margin: "0 16px", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: "#1E1C1A" }}>New Client</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#A09890" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={S.label}>Business Name *</label><input {...f("name")} placeholder="e.g. Ridge Roofing" style={S.input} /></div>
          <div><label style={S.label}>Contact Name</label><input {...f("contact_name")} placeholder="Jason R." style={S.input} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={S.label}>Email</label><input {...f("email")} style={S.input} /></div>
            <div><label style={S.label}>Phone</label><input {...f("phone")} style={S.input} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={S.label}>City</label><input {...f("city")} style={S.input} /></div>
            <div><label style={S.label}>State</label><input {...f("state")} placeholder="MD" style={S.input} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>Source</label>
              <select {...f("source")} style={S.select}>
                {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Tier</label>
              <select {...f("tier")} style={S.select}>
                <option value="">—</option>
                {Object.entries(TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>MRR Status</label>
              <select {...f("mrr_status")} style={S.select}>
                <option value="none">None</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            {form.mrr_status === "active" && (
              <div><label style={S.label}>Monthly ($)</label><input type="number" {...f("mrr_amount")} placeholder="500" style={S.input} /></div>
            )}
          </div>
          <div>
            <label style={S.label}>Notes</label>
            <textarea {...f("notes")} rows={2} placeholder="Any context…"
              style={{ ...S.input, resize: "none" } as React.CSSProperties} />
          </div>
        </div>
        <button onClick={submit} disabled={saving || !form.name.trim()}
          style={{ marginTop: 20, width: "100%", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving || !form.name.trim() ? 0.5 : 1 }}>
          {saving ? "Saving…" : "Add Client"}
        </button>
      </div>
    </div>
  );
}

// ── Client row ────────────────────────────────────────────────────────────────

function ClientRow({ client, projectCount }: { client: Client; projectCount: number }) {
  const [hov, setHov] = useState(false);
  const mrr = client.mrr_status;

  return (
    <Link href={`/clients/${client.id}`}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "13px 18px",
          backgroundColor: "#fff",
          border: "1px solid",
          borderColor: hov ? "#D9D1C3" : "#E8E2D8",
          borderRadius: 10,
          cursor: "pointer",
          boxShadow: hov ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 99,
          backgroundColor: "#1E1C1A",
          color: "#fff", fontSize: 13, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {client.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: hov ? "#FF6B2B" : "#1E1C1A", transition: "color 0.15s", lineHeight: 1.3 }}>
            {client.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            {client.contact_name && (
              <span style={{ fontSize: 11.5, color: "#6B6560" }}>{client.contact_name}</span>
            )}
            {client.source && (
              <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", color: "#A09890" }}>
                {SOURCE_LABELS[client.source] ?? client.source}
              </span>
            )}
          </div>
        </div>

        {/* Tier */}
        {client.tier && (
          <span style={{ fontSize: 11, color: "#6B6560", backgroundColor: "#F0EBE1", padding: "3px 9px", borderRadius: 99, flexShrink: 0, display: "none" }}
            className="md-show">
            {TIER_LABELS[client.tier] ?? client.tier}
          </span>
        )}

        {/* Projects */}
        <span style={{ fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", color: "#A09890", flexShrink: 0, minWidth: 64, textAlign: "right" }}>
          {projectCount} {projectCount === 1 ? "project" : "projects"}
        </span>

        {/* MRR badge */}
        <span style={{
          fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, flexShrink: 0,
          backgroundColor: mrr === "active" ? "#ECFBF0" : mrr === "churned" ? "#FEE8E8" : "#F0EBE1",
          color: mrr === "active" ? "#1E7A3C" : mrr === "churned" ? "#B83232" : "#A09890",
        }}>
          {mrr === "active"
            ? `MRR${client.mrr_amount ? ` · $${client.mrr_amount}` : ""}`
            : mrr === "churned" ? "Churned"
            : "Project"}
        </span>

        <ChevronRight size={14} color={hov ? "#FF6B2B" : "#C8C0B8"} style={{ flexShrink: 0, transition: "color 0.15s" }} />
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMrr, setFilterMrr] = useState<"all" | "active" | "none">("all");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const [{ data: cData }, { data: pData }] = await Promise.all([
      supabase.from("clients").select("*").eq("is_active", true).order("name"),
      supabase.from("projects").select("client_id"),
    ]);
    const counts: Record<string, number> = {};
    (pData ?? []).forEach((p: { client_id: string }) => {
      counts[p.client_id] = (counts[p.client_id] ?? 0) + 1;
    });
    setClients((cData as Client[]) ?? []);
    setProjectCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchMrr = filterMrr === "all" || c.mrr_status === filterMrr || (filterMrr === "none" && c.mrr_status === "none");
    return matchSearch && matchMrr;
  });

  const mrrTotal = clients.filter((c) => c.mrr_status === "active").reduce((s, c) => s + (c.mrr_amount ?? 0), 0);
  const mrrCount = clients.filter((c) => c.mrr_status === "active").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 80, color: "#A09890" }}>
        <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Total Clients", value: clients.length,          color: "#1E1C1A" },
          { label: "On Retainer",   value: mrrCount,                color: "#FF6B2B" },
          { label: "Monthly MRR",   value: `$${mrrTotal}/mo`,       color: "#1E7A3C" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, padding: "14px 20px" }}>
            <p style={{ fontSize: 10.5, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
            <p className="font-display" style={{ fontSize: 26, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={13} color="#A09890" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…"
            style={{ ...S.input, paddingLeft: 32, border: "1px solid #E8E2D8" }} />
        </div>

        <div style={{ display: "flex", backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["all", "active", "none"] as const).map((f) => (
            <button key={f} onClick={() => setFilterMrr(f)}
              style={{
                padding: "5px 13px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                backgroundColor: filterMrr === f ? "#1E1C1A" : "transparent",
                color: filterMrr === f ? "#fff" : "#6B6560",
              }}>
              {f === "all" ? "All" : f === "active" ? "Retainer" : "Project"}
            </button>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "8px 16px", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
          <Plus size={13} /> Add Client
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: "#A09890" }}>
            {search ? "No clients match." : "No clients yet."}
          </div>
        ) : (
          filtered.map((c) => <ClientRow key={c.id} client={c} projectCount={projectCounts[c.id] ?? 0} />)
        )}
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}
