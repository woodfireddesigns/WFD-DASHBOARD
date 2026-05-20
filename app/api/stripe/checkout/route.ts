import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_PRICES: Record<string, number> = {
  starter_site: 1200,
  full_website: 2400,
  brand_and_site: 4200,
};

const PACKAGE_LABELS: Record<string, string> = {
  starter_site: "Starter Site — Single page, mobile-optimized, Google-ready",
  full_website: "Full Website — Up to 5 pages, SEO foundation, lead capture",
  brand_and_site: "Brand + Site — Logo, brand identity, and full website",
};

const INTEGRATION_PRICES: Record<string, number> = {
  "Online booking system": 400,
  "Email capture / newsletter": 200,
  "Online store": 600,
  "Social media feeds": 150,
  "Chat widget": 200,
  "Payment processing": 400,
};

const EXTRA_PAGE_PRICE = 300;
const INCLUDED_PAGES = 5;

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const stripe = new Stripe(key);

  try {
    const { intakeId, paymentType } = await req.json();

    const { data: intake, error: dbErr } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();

    if (dbErr || !intake) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const pkg = intake.package as string;
    const clientName = `${intake.first_name} ${intake.last_name}`.trim();
    const businessName = (intake.business_name as string) || clientName;

    // Build itemized line items from intake data
    const basePrice = BASE_PRICES[pkg] ?? (intake.package_price as number);
    const pages = (intake.pages as string[]) ?? [];
    const integrations = (intake.integrations as string[]) ?? [];
    const extraPageCount = Math.max(0, pages.length - INCLUDED_PAGES);

    const lineItems: { description: string; amount: number }[] = [
      { description: PACKAGE_LABELS[pkg] ?? pkg, amount: basePrice },
    ];

    if (extraPageCount > 0) {
      lineItems.push({
        description: `Additional pages (${extraPageCount} × $${EXTRA_PAGE_PRICE})`,
        amount: extraPageCount * EXTRA_PAGE_PRICE,
      });
    }

    for (const integration of integrations) {
      const price = INTEGRATION_PRICES[integration];
      if (price) lineItems.push({ description: integration, amount: price });
    }

    const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email: intake.email as string, limit: 1 });
    const customer = existing.data[0] ?? await stripe.customers.create({
      email: intake.email as string,
      name: clientName,
      metadata: { intake_id: intakeId, business: businessName },
    });

    if (paymentType === "deposit") {
      // 50% deposit — single line item showing it's a deposit
      const depositAmount = Math.round(subtotal * 0.5);
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: depositAmount * 100,
        currency: "usd",
        description: `50% Project Deposit — ${businessName}`,
      });

      // Add a memo of what's included
      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          amount: 0,
          currency: "usd",
          description: `  ↳ ${item.description} ($${item.amount.toLocaleString()})`,
        });
      }

      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: 7,
        description: `50% deposit to begin your project. Remaining balance of $${depositAmount.toLocaleString()} due at delivery.`,
        footer: "Wood Fired Designs · Undrafted Designs LLC · michael@woodfireddesigns.com",
        metadata: { intake_id: intakeId, payment_type: "deposit" },
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      await supabase.from("intake_forms").update({ stripe_session_id: finalized.id }).eq("id", intakeId);
      return NextResponse.json({ url: finalized.hosted_invoice_url });

    } else {
      // Full payment with 5% discount — fully itemized
      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          amount: item.amount * 100,
          currency: "usd",
          description: item.description,
        });
      }

      // 5% discount
      const discount = await stripe.coupons.create({
        percent_off: 5,
        duration: "once",
        name: "Full Payment Discount",
      });

      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: 7,
        discounts: [{ coupon: discount.id }],
        description: `Full project payment for ${businessName}. 5% discount applied for paying in full.`,
        footer: "Wood Fired Designs · Undrafted Designs LLC · michael@woodfireddesigns.com",
        metadata: { intake_id: intakeId, payment_type: "full" },
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      await supabase.from("intake_forms").update({ stripe_session_id: finalized.id }).eq("id", intakeId);
      return NextResponse.json({ url: finalized.hosted_invoice_url });
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
