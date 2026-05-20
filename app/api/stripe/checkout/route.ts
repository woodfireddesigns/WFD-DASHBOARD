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

    // Fetch linked project for full deliverables breakdown
    const { data: project } = intake.project_id
      ? await supabase.from("projects").select("deliverables, name, notes").eq("id", intake.project_id).single()
      : { data: null };

    const projectDeliverables: string[] = project
      ? (project.deliverables as { text: string }[]).map((d) => d.text)
      : [];

    // Build priced line items
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
      if (price) lineItems.push({ description: `Integration: ${integration}`, amount: price });
    }

    const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);

    // Build deliverables description block from project
    const scopeBlock = projectDeliverables.length > 0
      ? `\n\nProject Scope:\n${projectDeliverables.map((d) => `• ${d}`).join("\n")}`
      : "";

    // Find or create Stripe customer
    const existing2 = await stripe.customers.list({ email: intake.email as string, limit: 1 });
    const customer2 = existing2.data[0] ?? await stripe.customers.create({
      email: intake.email as string,
      name: clientName,
      metadata: { intake_id: intakeId, business: businessName },
    });
    // Use customer2 going forward
    const cust = customer2;

    if (paymentType === "deposit") {
      const depositAmount = Math.round(subtotal * 0.5);

      // Main deposit line item
      await stripe.invoiceItems.create({
        customer: cust.id,
        amount: depositAmount * 100,
        currency: "usd",
        description: `50% Project Deposit — ${businessName}`,
      });

      // Priced breakdown as $0 memo lines
      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: cust.id,
          amount: 0,
          currency: "usd",
          description: `  ↳ ${item.description} ($${item.amount.toLocaleString()})`,
        });
      }

      // Deliverables as $0 scope lines
      for (const d of projectDeliverables) {
        await stripe.invoiceItems.create({
          customer: cust.id,
          amount: 0,
          currency: "usd",
          description: `  ✦ ${d}`,
        });
      }

      const invoice = await stripe.invoices.create({
        customer: cust.id,
        collection_method: "send_invoice",
        days_until_due: 7,
        description: `50% deposit to begin your project. Remaining $${depositAmount.toLocaleString()} due at delivery.${scopeBlock}`,
        footer: "Wood Fired Designs · Undrafted Designs LLC · michael@woodfireddesigns.com · woodfireddesigns.com",
        metadata: { intake_id: intakeId, payment_type: "deposit", project_id: intake.project_id as string ?? "" },
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      await supabase.from("intake_forms").update({ stripe_session_id: finalized.id }).eq("id", intakeId);
      return NextResponse.json({ url: finalized.hosted_invoice_url });

    } else {
      // Full payment — every line item priced individually
      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: cust.id,
          amount: item.amount * 100,
          currency: "usd",
          description: item.description,
        });
      }

      // Deliverables as $0 scope lines
      for (const d of projectDeliverables) {
        await stripe.invoiceItems.create({
          customer: cust.id,
          amount: 0,
          currency: "usd",
          description: `  ✦ ${d}`,
        });
      }

      // 5% discount coupon
      const discount = await stripe.coupons.create({
        percent_off: 5,
        duration: "once",
        name: "Full Payment — 5% Discount",
      });

      const invoice = await stripe.invoices.create({
        customer: cust.id,
        collection_method: "send_invoice",
        days_until_due: 7,
        discounts: [{ coupon: discount.id }],
        description: `Full project payment — ${businessName}. 5% discount applied for paying in full.${scopeBlock}`,
        footer: "Wood Fired Designs · Undrafted Designs LLC · michael@woodfireddesigns.com · woodfireddesigns.com",
        metadata: { intake_id: intakeId, payment_type: "full", project_id: intake.project_id as string ?? "" },
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
