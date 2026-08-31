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
  draft:     { label: "Draft",     color: "#8F827A", bg: "#1E1A16" },
  sent:      { label: "Sent",      color: "#5B9BD5", bg: "#152232" },
  paid:      { label: "Paid",      color: "#3FB86B", bg: "#12251A" },
  overdue:   { label: "Overdue",   color: "#E2564A", bg: "#2C1614" },
  cancelled: { label: "Cancelled", color: "#8F827A", bg: "#1E1A16" },
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 80, color: "#8F827A" }}>
      <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );
  if (!invoice) return <div style={{ fontSize: 13, color: "#8F827A", paddingTop: 40 }}>Invoice not found.</div>;

  const meta = STATUS_META[invoice.status] ?? STATUS_META.draft;
  const items: LineItem[] = invoice.line_items ?? [];

  return (
    <div style={{ maxWidth: 680 }}>
      <Link href="/invoices">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#8F827A", marginBottom: 20, cursor: "pointer" }}>
          <ArrowLeft size={13} /> All Invoices
        </div>
      </Link>

      {/* Invoice card */}
      <div style={{ backgroundColor: "#161310", border: "1px solid #2A241E", borderRadius: 12, overflow: "hidden" }}>
        {/* Header band */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #2A241E", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="font-display" style={{ fontSize: 13, color: "#FF6B2B", marginBottom: 6 }}>Wood Fired Designs</p>
            <p style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#8F827A" }}>michael@woodfireddesigns.com</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="font-display" style={{ fontSize: 22, color: "#F2EDE8" }}>{invoice.invoice_number}</p>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Bill to + dates */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #2A241E", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 500, color: "#8F827A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Bill To</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#F2EDE8" }}>{invoice.client?.name ?? "—"}</p>
            {invoice.client?.email && <p style={{ fontSize: 12, color: "#C4B8AE", marginTop: 2 }}>{invoice.client.email}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "right" }}>
            <div>
              <p style={{ fontSize: 10.5, color: "#8F827A" }}>Issue Date</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8" }}>
                {new Date(invoice.issue_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p style={{ fontSize: 10.5, color: "#8F827A" }}>Due Date</p>
                <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8" }}>
                  {new Date(invoice.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #2A241E" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 90px 90px", gap: 8, marginBottom: 10 }}>
            {["Description", "Qty", "Rate", "Amount"].map((h, i) => (
              <p key={h} style={{ fontSize: 10.5, fontWeight: 500, color: "#8F827A", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: i > 1 ? "right" : "left" }}>{h}</p>
            ))}
          </div>
          {items.map((item, idx) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 90px 90px", gap: 8, padding: "9px 0", borderTop: idx > 0 ? "1px solid #1E1A16" : "none" }}>
              <p style={{ fontSize: 13, color: "#F2EDE8" }}>{item.description || "—"}</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#C4B8AE", textAlign: "center" }}>{item.qty}</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#C4B8AE", textAlign: "right" }}>{fmt(item.rate * 100)}</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8", fontWeight: 600, textAlign: "right" }}>{fmt(item.qty * item.rate * 100)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #2A241E", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: "#C4B8AE" }}>Subtotal</span>
              <span style={{ fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8" }}>{fmt(invoice.subtotal)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "#C4B8AE" }}>Tax ({invoice.tax_rate}%)</span>
                <span style={{ fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", color: "#F2EDE8" }}>{fmt(invoice.tax_amount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1.5px solid #F2EDE8" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#F2EDE8" }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: invoice.status === "paid" ? "#3FB86B" : "#F2EDE8" }}>{fmt(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ padding: "16px 28px", borderBottom: "1px solid #2A241E" }}>
            <p style={{ fontSize: 10.5, fontWeight: 500, color: "#8F827A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Notes</p>
            <p style={{ fontSize: 13, color: "#C4B8AE", lineHeight: 1.6 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "16px 28px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {invoice.status === "draft" && (
            <button onClick={() => updateStatus("sent")}
              style={{ padding: "8px 18px", backgroundColor: "#5B9BD5", color: "#0F0D0B", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
              Mark as Sent
            </button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <button onClick={() => updateStatus("paid")}
              style={{ padding: "8px 18px", backgroundColor: "#3FB86B", color: "#0F0D0B", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
              Mark as Paid
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button onClick={() => updateStatus("cancelled")}
              style={{ padding: "8px 18px", backgroundColor: "#1E1A16", color: "#C4B8AE", border: "1px solid #2A241E", borderRadius: 8, cursor: "pointer", fontSize: 12.5 }}>
              Cancel
            </button>
          )}
          <button onClick={deleteInvoice}
            style={{ marginLeft: "auto", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", color: "#8F827A", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E2564A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8F827A")}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
