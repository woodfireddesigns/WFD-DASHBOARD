"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, Client } from "@/lib/supabase";
import { Plus, X, ChevronRight, Loader2 } from "lucide-react";

interface LineItem { id: string; description: string; qty: number; rate: number }
interface Invoice {
  id: string; created_at: string; client_id: string | null; project_id: string | null;
  invoice_number: string; status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string; due_date: string | null; paid_at: string | null;
  subtotal: number; tax_rate: number; tax_amount: number; total: number;
  notes: string | null; line_items: LineItem[];
  client?: { name: string } | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#8F827A", bg: "#1E1A16" },
  sent:      { label: "Sent",      color: "#5B9BD5", bg: "#152232" },
  paid:      { label: "Paid",      color: "#3FB86B", bg: "#12251A" },
  overdue:   { label: "Overdue",   color: "#E2564A", bg: "#2C1614" },
  cancelled: { label: "Cancelled", color: "#8F827A", bg: "#1E1A16" },
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function calcTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + Math.round(i.qty * i.rate * 100), 0);
  const taxAmount = Math.round(subtotal * taxRate / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

// ── New invoice modal ─────────────────────────────────────────────────────────

function NewInvoiceModal({ clients, onClose, onCreated }: { clients: Client[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<LineItem[]>([{ id: uid(), description: "", qty: 1, rate: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function addItem() { setItems((p) => [...p, { id: uid(), description: "", qty: 1, rate: 0 }]); }
  function removeItem(id: string) { setItems((p) => p.filter((i) => i.id !== id)); }
  function updateItem(id: string, key: keyof LineItem, value: string | number) {
    setItems((p) => p.map((i) => i.id === id ? { ...i, [key]: value } : i));
  }

  const { subtotal, taxAmount, total } = calcTotals(items, taxRate);
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  async function submit() {
    if (!clientId) return;
    setSaving(true);
    const num = `INV-${Date.now().toString().slice(-5)}`;
    const { data } = await supabase.from("invoices").insert({
      client_id: clientId, invoice_number: num, status: "draft",
      issue_date: new Date().toISOString().slice(0, 10), due_date: dueDate,
      subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
      notes: notes || null, line_items: items,
    }).select().single();
    setSaving(false);
    if (data) onCreated(data.id);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,5,4,0.72)", backdropFilter: "blur(4px)" }}>
      <div style={{ backgroundColor: "#161310", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.14)", width: "100%", maxWidth: 540, margin: "0 16px", padding: 24, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: "#F2EDE8" }}>New Invoice</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8F827A" }}><X size={16} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Client + due */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#C4B8AE", marginBottom: 4 }}>Client *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                style={{ width: "100%", fontSize: 13, border: "1px solid #2A241E", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#1E1A16" }}>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#C4B8AE", marginBottom: 4 }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                style={{ width: "100%", fontSize: 13, border: "1px solid #2A241E", borderRadius: 8, padding: "8px 12px", outline: "none", backgroundColor: "#1E1A16" }} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 80px 24px", gap: 6, marginBottom: 6 }}>
              {["Description", "Qty", "Rate", ""].map((h) => (
                <p key={h} style={{ fontSize: 10.5, fontWeight: 500, color: "#8F827A", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</p>
              ))}
            </div>
            {items.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 56px 80px 24px", gap: 6, marginBottom: 5, alignItems: "center" }}>
                <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Service description"
                  style={{ fontSize: 12.5, border: "1px solid #2A241E", borderRadius: 6, padding: "6px 10px", outline: "none", backgroundColor: "#1E1A16", color: "#F2EDE8" }} />
                <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                  style={{ fontSize: 12.5, border: "1px solid #2A241E", borderRadius: 6, padding: "6px 8px", outline: "none", backgroundColor: "#1E1A16", color: "#F2EDE8", textAlign: "center" }} />
                <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} placeholder="0.00"
                  style={{ fontSize: 12.5, border: "1px solid #2A241E", borderRadius: 6, padding: "6px 8px", outline: "none", backgroundColor: "#1E1A16", color: "#F2EDE8", fontFamily: "JetBrains Mono, monospace" }} />
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8F827A", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E2564A")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8F827A")}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <button onClick={addItem} style={{ fontSize: 12, color: "#8F827A", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 2 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B2B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8F827A")}>
              + Add line item
            </button>
          </div>

          {/* Tax + totals */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#C4B8AE" }}>Subtotal</span>
                <span style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8" }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#C4B8AE" }}>Tax %</span>
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  style={{ width: 54, fontSize: 12, border: "1px solid #2A241E", borderRadius: 5, padding: "3px 6px", outline: "none", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #2A241E" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F2EDE8" }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8" }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#C4B8AE", marginBottom: 4 }}>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Payment terms, thank you note…"
              style={{ width: "100%", fontSize: 13, border: "1px solid #2A241E", borderRadius: 8, padding: "8px 12px", outline: "none", resize: "none", backgroundColor: "#1E1A16", color: "#F2EDE8", fontFamily: "Inter, sans-serif" }} />
          </div>
        </div>

        <button onClick={submit} disabled={saving || !clientId}
          style={{ marginTop: 20, width: "100%", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !clientId || saving ? 0.5 : 1 }}>
          {saving ? "Creating…" : "Create Invoice"}
        </button>
      </div>
    </div>
  );
}

// ── Invoice row ───────────────────────────────────────────────────────────────

function InvoiceRow({ inv }: { inv: Invoice }) {
  const [hov, setHov] = useState(false);
  const meta = STATUS_META[inv.status];
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const overdue = inv.due_date && inv.status === "sent" && new Date(inv.due_date) < new Date();

  return (
    <Link href={`/invoices/${inv.id}`}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 18px", backgroundColor: "#161310", border: `1px solid ${hov ? "#3A322A" : "#2A241E"}`, borderRadius: 10, cursor: "pointer", boxShadow: hov ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.15s" }}>

        {/* Number */}
        <span style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#8F827A", flexShrink: 0, minWidth: 80 }}>
          {inv.invoice_number}
        </span>

        {/* Client */}
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: hov ? "#FF6B2B" : "#F2EDE8", transition: "color 0.15s", minWidth: 0 }}>
          {inv.client?.name ?? "—"}
        </span>

        {/* Date */}
        <span style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#8F827A", flexShrink: 0 }}>
          {new Date(inv.issue_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>

        {/* Due */}
        {inv.due_date && (
          <span style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: overdue ? "#E2564A" : "#8F827A", flexShrink: 0 }}>
            {overdue ? "Overdue" : `Due ${new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </span>
        )}

        {/* Amount */}
        <span style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: inv.status === "paid" ? "#3FB86B" : "#F2EDE8", flexShrink: 0, minWidth: 80, textAlign: "right" }}>
          {fmt(inv.total)}
        </span>

        {/* Status */}
        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: meta.bg, color: meta.color, flexShrink: 0 }}>
          {meta.label}
        </span>

        <ChevronRight size={14} color={hov ? "#FF6B2B" : "#8F827A"} style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "paid" | "overdue">("all");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    const [{ data: iData }, { data: cData }] = await Promise.all([
      supabase.from("invoices").select("*, client:clients(name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("is_active", true).order("name"),
    ]);
    setInvoices((iData as Invoice[]) ?? []);
    setClients((cData as Client[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const withOverdue = invoices.map((inv) => ({
    ...inv,
    status: (inv.status === "sent" && inv.due_date && new Date(inv.due_date) < now ? "overdue" : inv.status) as Invoice["status"],
  }));

  const filtered = filter === "all" ? withOverdue : withOverdue.filter((i) => i.status === filter);
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const totalSent   = withOverdue.filter((i) => i.status === "sent").reduce((s, i) => s + i.total, 0);
  const totalPaid   = withOverdue.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalOverdue = withOverdue.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 80, color: "#8F827A" }}>
      <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Outstanding", value: fmt(totalSent),    color: "#5B9BD5" },
          { label: "Collected",   value: fmt(totalPaid),    color: "#3FB86B" },
          { label: "Overdue",     value: fmt(totalOverdue), color: totalOverdue > 0 ? "#E2564A" : "#8F827A" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, backgroundColor: "#161310", border: "1px solid #2A241E", borderRadius: 10, padding: "14px 20px" }}>
            <p style={{ fontSize: 10.5, color: "#8F827A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
            <p className="font-display" style={{ fontSize: 26, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", backgroundColor: "#161310", border: "1px solid #2A241E", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["all","sent","paid","overdue"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "5px 13px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.15s", textTransform: "capitalize", backgroundColor: filter === f ? "#F2EDE8" : "transparent", color: filter === f ? "#fff" : "#C4B8AE" }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "8px 16px", backgroundColor: "#FF6B2B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
          <Plus size={13} /> New Invoice
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: "#8F827A" }}>No invoices yet.</div>
        ) : (
          filtered.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)
        )}
      </div>

      {showNew && <NewInvoiceModal clients={clients} onClose={() => setShowNew(false)} onCreated={(id) => { load(); }} />}
    </div>
  );
}
