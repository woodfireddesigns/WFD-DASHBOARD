import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "STRIPE_SECRET_KEY not set" }, { status: 500 });

  const stripe = new Stripe(key);

  try {
    const { intakeId, paymentType } = await req.json();

    const { data: intake, error: dbErr } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();

    if (dbErr || !intake) {
      return NextResponse.json({ error: "Intake form not found" }, { status: 404 });
    }

    const BASE_PRICES: Record<string, number> = {
      starter_site: 1200,
      full_website: 2400,
      brand_and_site: 4200,
    };

    const PACKAGE_LABELS: Record<string, string> = {
      starter_site: "Starter Site",
      full_website: "Full Website",
      brand_and_site: "Brand + Site",
    };

    const storedPrice = intake.package_price as number;
    const fallback = BASE_PRICES[intake.package as string] ?? 0;
    const total = storedPrice > 0 ? storedPrice : fallback;

    if (total === 0) {
      return NextResponse.json({ error: "Could not determine project price. Please contact michael@woodfireddesigns.com." }, { status: 400 });
    }

    const clientName = `${intake.first_name} ${intake.last_name}`.trim();
    const packageLabel = PACKAGE_LABELS[intake.package as string] ?? "Website Project";

    let amountCents: number;
    let description: string;

    if (paymentType === "deposit") {
      amountCents = Math.round(total * 0.5) * 100;
      description = `${packageLabel} — 50% Deposit (${intake.business_name || clientName})`;
    } else {
      amountCents = Math.round(total * 0.95) * 100;
      description = `${packageLabel} — Full Payment, 5% discount applied (${intake.business_name || clientName})`;
    }

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email: intake.email as string, limit: 1 });
    const customer = existing.data[0] ?? await stripe.customers.create({
      email: intake.email as string,
      name: clientName,
      metadata: { intake_id: intakeId },
    });

    // Create invoice item
    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: amountCents,
      currency: "usd",
      description,
    });

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      metadata: { intake_id: intakeId, payment_type: paymentType },
      footer: "Wood Fired Designs — Undrafted Designs LLC",
    });

    // Finalize so hosted URL is available
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // Save session ref
    await supabase
      .from("intake_forms")
      .update({ stripe_session_id: finalized.id })
      .eq("id", intakeId);

    return NextResponse.json({ url: finalized.hosted_invoice_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
