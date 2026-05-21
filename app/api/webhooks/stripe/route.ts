import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendInvoicePaid } from "@/lib/email";

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

      sendInvoicePaid({
        name: `${intake.first_name} ${intake.last_name}`.trim(),
        business: (intake.business_name as string) ?? "",
        email: intake.email as string,
        amount: amountPaid,
        paymentType,
        portalToken: intake.portal_token as string,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true });
}
