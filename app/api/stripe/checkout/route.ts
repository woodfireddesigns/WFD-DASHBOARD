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
  starter_site: "Starter Site",
  full_website: "Full Website",
  brand_and_site: "Brand + Site",
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

    // Load intake form
    const { data: intake, error: dbErr } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();

    if (dbErr || !intake) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Load linked project deliverables
    const { data: project } = intake.project_id
      ? await supabase.from("projects").select("deliverables").eq("id", intake.project_id).single()
      : { data: null };

    const deliverables: string[] = project
      ? (project.deliverables as { text: string }[]).map((d) => d.text)
      : [];

    // Calculate total
    const pkg = intake.package as string;
    const clientName = `${intake.first_name} ${intake.last_name}`.trim();
    const businessName = (intake.business_name as string) || clientName;

    const basePrice = (intake.package_price as number) > 0
      ? (intake.package_price as number)
      : (BASE_PRICES[pkg] ?? 0);

    // Build priced line items
    const pages = (intake.pages as string[]) ?? [];
    const integrations = (intake.integrations as string[]) ?? [];
    const extraPageCount = Math.max(0, pages.length - INCLUDED_PAGES);

    interface LineItem { description: string; amount: number }
    const lineItems: LineItem[] = [
      { description: `${PACKAGE_LABELS[pkg] ?? pkg} — Wood Fired Designs`, amount: basePrice },
    ];

    if (extraPageCount > 0) {
      lineItems.push({
        description: `Additional pages (${extraPageCount} × $${EXTRA_PAGE_PRICE})`,
        amount: extraPageCount * EXTRA_PAGE_PRICE,
      });
    }

    for (const integration of integrations.filter(i => i !== "None needed")) {
      const price = INTEGRATION_PRICES[integration];
      if (price) lineItems.push({ description: integration, amount: price });
    }

    const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);

    if (subtotal === 0) {
      return NextResponse.json({ error: "Could not determine project price. Contact michael@woodfireddesigns.com." }, { status: 400 });
    }

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email: intake.email as string, limit: 1 });
    const customer = existing.data[0] ?? await stripe.customers.create({
      email: intake.email as string,
      name: clientName,
      metadata: { intake_id: intakeId, business: businessName },
    });

    // ── Critical: delete ALL pending invoice items for this customer ──
    // Stale $0 items from previous attempts cause $0 invoices
    const pendingItems = await stripe.invoiceItems.list({ customer: customer.id, limit: 100 });
    for (const item of pendingItems.data) {
      if (!item.invoice) await stripe.invoiceItems.del(item.id);
    }

    // Build scope description for invoice memo
    const scopeLines = deliverables.length > 0
      ? `\n\nScope of Work:\n${deliverables.map(d => `• ${d}`).join("\n")}`
      : "";

    if (paymentType === "deposit") {
      const depositAmount = Math.round(subtotal * 0.5);

      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: depositAmount * 100,
        currency: "usd",
        description: `50% Project Deposit — ${businessName} (${PACKAGE_LABELS[pkg] ?? pkg})`,
      });

      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: "send_invoice",
        auto_advance: false,
        days_until_due: 7,
        description: `Project deposit for ${businessName}. Remaining balance of $${depositAmount.toLocaleString()} due upon project delivery.${scopeLines}`,
        footer: "Wood Fired Designs · Undrafted Designs LLC · michael@woodfireddesigns.com · woodfireddesigns.com",
        metadata: { intake_id: intakeId, payment_type: "deposit" },
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

      // Safety: never let a $0 invoice through
      if ((finalized.amount_due ?? 0) === 0) {
        await stripe.invoices.voidInvoice(finalized.id);
        return NextResponse.json({ error: `Invoice amount calculated as $0. subtotal=${subtotal}, deposit=${depositAmount}. Contact michael@woodfireddesigns.com.` }, { status: 400 });
      }

      await supabase.from("intake_forms").update({ stripe_session_id: finalized.id }).eq("id", intakeId);
      return NextResponse.json({ url: finalized.hosted_invoice_url });

    } else {
      // Full payment — every priced line item
      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          amount: item.amount * 100,
          currency: "usd",
          description: item.description,
        });
      }

      // 5% discount coupon
      const coupon = await stripe.coupons.create({
        percent_off: 5,
        duration: "once",
        name: "Full Payment — 5% Discount",
      });

      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: 7,
        discounts: [{ coupon: coupon.id }],
        description: `Full project payment — ${businessName}. 5% discount applied for paying in full.${scopeLines}`,
        footer: "Wood Fired Designs · Undrafted Designs LLC · michael@woodfireddesigns.com · woodfireddesigns.com",
        metadata: { intake_id: intakeId, payment_type: "full" },
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

      if ((finalized.amount_due ?? 0) === 0) {
        await stripe.invoices.voidInvoice(finalized.id);
        return NextResponse.json({ error: `Invoice amount calculated as $0. subtotal=${subtotal}. Contact michael@woodfireddesigns.com.` }, { status: 400 });
      }

      await supabase.from("intake_forms").update({ stripe_session_id: finalized.id }).eq("id", intakeId);
      return NextResponse.json({ url: finalized.hosted_invoice_url });
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
