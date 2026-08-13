import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendInvoicePaid, sendPaymentConfirmationToClient } from "@/lib/email";
import { sendSMS } from "@/lib/reminders";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${String(err)}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const intakeId = session.metadata?.intake_id;
    const paymentType = session.metadata?.payment_type ?? "deposit";

    // Contract-driven payments (proposals → phase invoices) carry proposal_id
    // instead of intake_id. Settle the invoice and move the project forward.
    const proposalId = session.metadata?.proposal_id;
    if (proposalId) {
      try {
        const db = supabaseAdmin();
        const invoiceId = session.metadata?.invoice_id;
        const paidDate = new Date().toISOString().slice(0, 10);

        if (invoiceId) {
          await db
            .from("invoices")
            .update({ status: "paid", paid_date: paidDate })
            .eq("id", invoiceId);
        }

        const { data: proposal } = await db
          .from("proposals")
          .select("client_name, company, email, project_id, deposit_label, deposit_amount, total")
          .eq("id", proposalId)
          .single();

        if (proposal?.project_id) {
          await db.from("projects").update({ status: "design", paid: true }).eq("id", proposal.project_id);
        }

        if (proposal) {
          sendInvoicePaid({
            name: proposal.client_name as string,
            business: (proposal.company as string) ?? "",
            email: proposal.email as string,
            amount: (session.amount_total ?? 0) / 100,
            paymentType: (proposal.deposit_label as string) ?? "phase one",
            portalToken: proposalId,
          }).catch(console.error);
        }
      } catch (err) {
        console.error("Proposal payment webhook failed:", err);
      }
      return NextResponse.json({ ok: true });
    }

    if (!intakeId) return NextResponse.json({ ok: true });

    const { data: intake } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();

    if (intake) {
      // Update payment status
      const update = paymentType === "full"
        ? { deposit_paid: true, full_paid: true, status: "paid" }
        : { deposit_paid: true };

      await supabase.from("intake_forms").update(update).eq("id", intakeId);
      if (intake.project_id) {
        await supabase.from("projects").update({ status: "design" }).eq("id", intake.project_id);
      }

      const amountPaid = (session.amount_total ?? 0) / 100;

      // Notify Michael
      sendInvoicePaid({
        name: `${intake.first_name} ${intake.last_name}`.trim(),
        business: (intake.business_name as string) ?? "",
        email: intake.email as string,
        amount: amountPaid,
        paymentType,
        portalToken: intake.portal_token as string,
      }).catch(console.error);

      // Confirm to client with portal link
      const portalUrl = `https://wfd-dashboard.vercel.app/portal/${intake.portal_token}`;
      sendPaymentConfirmationToClient({
        firstName: intake.first_name as string,
        email: intake.email as string,
        pkg: intake.package as string,
        amount: amountPaid,
        paymentType,
        portalToken: intake.portal_token as string,
      }).catch(console.error);

      // SMS if Twilio configured
      if (intake.phone) {
        const smsBody = paymentType === "deposit"
          ? `Hey ${intake.first_name}, your deposit is confirmed! Michael will be in touch within 1 business day. Your portal: ${portalUrl}`
          : `Hey ${intake.first_name}, full payment confirmed! Michael will be in touch within 1 business day. Your portal: ${portalUrl}`;
        sendSMS(intake.phone as string, smsBody).catch(console.error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
