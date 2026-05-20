"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

interface LineItem { id: string; description: string; qty: number; rate: number }
interface Invoice {
  id: string; invoice_number: string; status: string;
  issue_date: string; due_date: string | null; paid_at: string | null;
  subtotal: number; tax_rate: number; tax_amount: number; total: number;
  notes: string | null; line_items: LineItem[];
  client?: { name: string; email: string | null } | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#A09890", bg: "#F0EBE1" },
  sent:      { label: "Sent",      color: "#1E5FAA", bg: "#EEF4FF" },
  paid:      { label: "Paid",      color: "#1E7A3C", bg: "#ECFBF0" },
  overdue:   { label: "Overdue",   color: "#B83232", bg: "#FEE8E8" },
  cancelled: { label: "Cancelled", color: "#A09890", bg: "#F8F5F0" },
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("invoices").select("*, client:clients(name, email)").eq("id", id).single();
    setInvoice(data as Invoice);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: string) {
    const update: Record<string, unknown> = { status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    setInvoice((p) => p ? { ...p, ...update } : p);
    await supabase.from("invoices").update(update).eq("id", id);
  }

  async function deleteInvoice() {
    if (!confirm("Delete this invoice? Cannot be undone.")) return;
    await supabase.from("invoices").delete().eq("id", id);
    router.push("/invoices");
  }

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 80, color: "#A09890" }}>
      <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );
  if (!invoice) return <div style={{ fontSize: 13, color: "#A09890", paddingTop: 40 }}>Invoice not found.</div>;

  const meta = STATUS_META[invoice.status] ?? STATUS_META.draft;
  const items: LineItem[] = invoice.line_items ?? [];

  return (
    <div style={{ maxWidth: 680 }}>
      <Link href="/invoices">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#A09890", marginBottom: 20, cursor: "pointer" }}>
          <ArrowLeft size={13} /> All Invoices
        </div>
      </Link>

      {/* Invoice card */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", borderRadius: 12, overflow: "hidden" }}>
        {/* Header band */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #E8E2D8", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="font-display" style={{ fontSize: 13, color: "#FF6B2B", marginBottom: 6 }}>Wood Fired Designs</p>
            <p style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#A09890" }}>michael@woodfireddesigns.com</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="font-display" style={{ fontSize: 22, color: "#1E1C1A" }}>{invoice.invoice_number}</p>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Bill to + dates */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #E8E2D8", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 500, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Bill To</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1E1C1A" }}>{invoice.client?.name ?? "—"}</p>
            {invoice.client?.email && <p style={{ fontSize: 12, color: "#6B6560", marginTop: 2 }}>{invoice.client.email}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "right" }}>
            <div>
              <p style={{ fontSize: 10.5, color: "#A09890" }}>Issue Date</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#1E1C1A" }}>
                {new Date(invoice.issue_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p style={{ fontSize: 10.5, color: "#A09890" }}>Due Date</p>
                <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#1E1C1A" }}>
                  {new Date(invoice.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #E8E2D8" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 90px 90px", gap: 8, marginBottom: 10 }}>
            {["Description", "Qty", "Rate", "Amount"].map((h, i) => (
              <p key={h} style={{ fontSize: 10.5, fontWeight: 500, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: i > 1 ? "right" : "left" }}>{h}</p>
            ))}
          </div>
          {items.map((item, idx) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 90px 90px", gap: 8, padding: "9px 0", borderTop: idx > 0 ? "1px solid #F0EBE1" : "none" }}>
              <p style={{ fontSize: 13, color: "#1E1C1A" }}>{item.description || "—"}</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#6B6560", textAlign: "center" }}>{item.qty}</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#6B6560", textAlign: "right" }}>{fmt(item.rate * 100)}</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#1E1C1A", fontWeight: 600, textAlign: "right" }}>{fmt(item.qty * item.rate * 100)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #E8E2D8", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: "#6B6560" }}>Subtotal</span>
              <span style={{ fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", color: "#1E1C1A" }}>{fmt(invoice.subtotal)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "#6B6560" }}>Tax ({invoice.tax_rate}%)</span>
                <span style={{ fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", color: "#1E1C1A" }}>{fmt(invoice.tax_amount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1.5px solid #1E1C1A" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E1C1A" }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: invoice.status === "paid" ? "#1E7A3C" : "#1E1C1A" }}>{fmt(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ padding: "16px 28px", borderBottom: "1px solid #E8E2D8" }}>
            <p style={{ fontSize: 10.5, fontWeight: 500, color: "#A09890", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Notes</p>
            <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.6 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "16px 28px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {invoice.status === "draft" && (
            <button onClick={() => updateStatus("sent")}
              style={{ padding: "8px 18px", backgroundColor: "#1E5FAA", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
              Mark as Sent
            </button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <button onClick={() => updateStatus("paid")}
              style={{ padding: "8px 18px", backgroundColor: "#1E7A3C", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
              Mark as Paid
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button onClick={() => updateStatus("cancelled")}
              style={{ padding: "8px 18px", backgroundColor: "#F8F5F0", color: "#6B6560", border: "1px solid #E8E2D8", borderRadius: 8, cursor: "pointer", fontSize: 12.5 }}>
              Cancel
            </button>
          )}
          <button onClick={deleteInvoice}
            style={{ marginLeft: "auto", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", color: "#C8C0B8", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#B83232")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C8C0B8")}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
