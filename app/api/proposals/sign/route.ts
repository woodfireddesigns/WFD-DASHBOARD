import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { renderContractPdf, type ContractLineItem } from "@/lib/contract-pdf";
import { sendContractSigned } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "contracts";

/**
 * Executes a proposal contract in one server-side transaction-ish pass:
 *
 *   1. stamp the signature on the proposal
 *   2. create the full-contract invoice + its line items
 *   3. create the phase-one invoice + its line items
 *   4. render the executed agreement to PDF and store it
 *   5. open a Stripe Checkout session for the phase-one invoice
 *
 * Steps 1-3 are the record of the deal and must succeed. Steps 4-5 are
 * best-effort: a PDF that fails to render must not lose a signed contract, and
 * the caller falls back to a "we'll email you the invoice" state if Stripe is
 * unreachable.
 *
 * Idempotent: signing twice returns the existing checkout URL rather than
 * creating a second set of invoices.
 */

function invoiceNumberFrom(seq: number): string {
  return `011024-${String(seq).padStart(6, "0")}`;
}

async function nextInvoiceSeq(db: ReturnType<typeof supabaseAdmin>): Promise<number> {
  const { data } = await db
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", "011024-%")
    .order("invoice_number", { ascending: false })
    .limit(1);
  const last = data?.[0]?.invoice_number as string | undefined;
  const n = last ? parseInt(last.split("-")[1], 10) : 0;
  return Number.isFinite(n) ? n + 1 : 1;
}

export async function POST(req: NextRequest) {
  let db: ReturnType<typeof supabaseAdmin>;
  try {
    db = supabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  try {
    const { proposalId, signedName } = await req.json();
    if (!proposalId || !signedName?.trim()) {
      return NextResponse.json({ error: "proposalId and signedName are required" }, { status: 400 });
    }
    const name = String(signedName).trim().slice(0, 120);

    const { data: proposal, error: loadErr } = await db
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (loadErr || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const total = proposal.total as number;
    const deposit = (proposal.deposit_amount as number | null) ?? Math.round(total * 0.5);
    const depositLabel = (proposal.deposit_label as string | null) ?? "50% Project Deposit";
    const lineItems = (proposal.line_items ?? []) as ContractLineItem[];
    const company = (proposal.company as string | null) ?? null;
    const clientLabel = company ? `${proposal.client_name} — ${company}` : (proposal.client_name as string);

    // ── Idempotency ──────────────────────────────────────────────────────────
    // Already executed: hand back the existing payment link instead of
    // double-invoicing. A refresh or a double-click must not cost money.
    if (proposal.status === "signed" && proposal.stripe_payment_link) {
      return NextResponse.json({
        ok: true,
        alreadySigned: true,
        checkoutUrl: proposal.stripe_payment_link,
        pdfUrl: proposal.contract_pdf_url ?? null,
      });
    }

    const signedAt = proposal.signed_at ?? new Date().toISOString();

    // ── 1. Execute the contract ──────────────────────────────────────────────
    if (proposal.status !== "signed") {
      const { error: signErr } = await db
        .from("proposals")
        .update({ status: "signed", signed_name: name, signed_at: signedAt })
        .eq("id", proposalId);
      if (signErr) throw new Error(`Could not record signature: ${signErr.message}`);
    }

    // ── 2 & 3. Invoices ──────────────────────────────────────────────────────
    // Only create them once, even if a later step failed on a previous attempt.
    const { data: existing } = await db
      .from("invoices")
      .select("id, total_cents, notes")
      .eq("proposal_id", proposalId);

    let phaseInvoiceId: string | null = null;

    if (!existing || existing.length === 0) {
      const seq = await nextInvoiceSeq(db);
      const today = new Date().toISOString().slice(0, 10);

      // Full contract of record — draft, not payable; it documents the deal.
      const { data: fullInv, error: fullErr } = await db
        .from("invoices")
        .insert({
          invoice_number: invoiceNumberFrom(seq),
          client_name: clientLabel,
          client_email: proposal.email,
          client_company: company,
          proposal_id: proposalId,
          status: "draft",
          subtotal_cents: total * 100,
          total_cents: total * 100,
          issued_date: today,
          notes: `Full contract of record. Signed by ${name} on ${new Date(signedAt).toLocaleDateString()}. Billed per phase; see the phase invoices.`,
        })
        .select("id")
        .single();
      if (fullErr) throw new Error(`Could not create contract invoice: ${fullErr.message}`);

      await db.from("invoice_items").insert(
        lineItems.map((li, i) => ({
          invoice_id: fullInv.id,
          description: li.label,
          quantity: 1,
          unit_price_cents: li.price * 100,
          total_cents: li.price * 100,
          sort_order: i,
        }))
      );

      // Phase one — the one she actually pays now.
      const { data: phaseInv, error: phaseErr } = await db
        .from("invoices")
        .insert({
          invoice_number: invoiceNumberFrom(seq + 1),
          client_name: clientLabel,
          client_email: proposal.email,
          client_company: company,
          proposal_id: proposalId,
          status: "sent",
          subtotal_cents: deposit * 100,
          total_cents: deposit * 100,
          issued_date: today,
          due_date: today,
          notes: `${depositLabel}. Due to begin work. Contract signed by ${name} on ${new Date(signedAt).toLocaleDateString()}.`,
        })
        .select("id")
        .single();
      if (phaseErr) throw new Error(`Could not create phase invoice: ${phaseErr.message}`);
      phaseInvoiceId = phaseInv.id;

      const first = lineItems[0];
      await db.from("invoice_items").insert([
        {
          invoice_id: phaseInv.id,
          description: first?.label ?? depositLabel,
          quantity: 1,
          unit_price_cents: deposit * 100,
          total_cents: deposit * 100,
          sort_order: 0,
        },
      ]);
    } else {
      phaseInvoiceId =
        existing.find((i) => (i.total_cents as number) === deposit * 100)?.id ?? existing[0].id;
    }

    // ── 4. Executed PDF → storage (best effort) ──────────────────────────────
    let pdfUrl: string | null = (proposal.contract_pdf_url as string | null) ?? null;
    if (!pdfUrl) {
      try {
        const bytes = await renderContractPdf({
          proposalId: proposalId as string,
          clientName: proposal.client_name as string,
          company,
          email: proposal.email as string,
          lineItems,
          total,
          depositAmount: deposit,
          depositLabel,
          signedName: name,
          signedAt,
          createdAt: proposal.created_at as string,
        });

        const path = `${proposalId}/service-agreement-${proposalId.slice(0, 8)}.pdf`;
        const { error: upErr } = await db.storage
          .from(BUCKET)
          .upload(path, Buffer.from(bytes), { contentType: "application/pdf", upsert: true });
        if (upErr) throw upErr;

        // Bucket is private; hand out a long-lived signed URL (1 year) so the
        // dashboard and the confirmation email can both open it.
        const { data: signedUrl } = await db.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        pdfUrl = signedUrl?.signedUrl ?? null;

        if (pdfUrl) {
          await db.from("proposals").update({ contract_pdf_url: pdfUrl }).eq("id", proposalId);
        }
      } catch (err) {
        // A failed PDF must never lose an executed contract.
        console.error("Contract PDF generation failed:", err);
      }
    }

    // ── 5. Stripe checkout for phase one (best effort) ───────────────────────
    let checkoutUrl: string | null = null;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && deposit > 0) {
      try {
        const stripe = new Stripe(stripeKey);
        const origin = req.nextUrl.origin;
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: proposal.email as string,
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: deposit * 100,
                product_data: {
                  name: `${depositLabel} — Wood Fired Designs`,
                  description: `${company ?? proposal.client_name} · Balance of $${(
                    total - deposit
                  ).toLocaleString()} invoiced per phase`,
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            proposal_id: proposalId as string,
            invoice_id: phaseInvoiceId ?? "",
            payment_type: "phase_one",
          },
          success_url: `${origin}/proposal/${proposalId}?paid=1`,
          cancel_url: `${origin}/proposal/${proposalId}?canceled=1`,
        });
        checkoutUrl = session.url;

        await db.from("proposals").update({ stripe_payment_link: checkoutUrl }).eq("id", proposalId);
        if (phaseInvoiceId) {
          await db.from("invoices").update({ stripe_session_id: session.id }).eq("id", phaseInvoiceId);
        }
      } catch (err) {
        console.error("Stripe session failed:", err);
      }
    }

    // Notify Michael. Non-blocking — an email outage must not fail the signing.
    sendContractSigned({
      name: proposal.client_name as string,
      business: company ?? "",
      email: proposal.email as string,
      package: depositLabel,
      total,
      signedName: name,
      portalToken: proposalId as string,
    }).catch(console.error);

    return NextResponse.json({ ok: true, checkoutUrl, pdfUrl, signedAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Contract signing failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
