import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_PRICES: Record<string, number> = {
  starter_site: 1200, full_website: 2400, brand_and_site: 4200, test_package: 19,
  spark_identity: 1200, ignite_brand: 3500, forge_identity: 6500,
  packaging_single: 1200, packaging_system: 2800,
  photo_starter: 800, photo_pro: 1500, photo_campaign: 2800,
  merch_single: 800, merch_line: 1800,
};

const PACKAGE_LABELS: Record<string, string> = {
  starter_site: "Starter Site", full_website: "Full Website", brand_and_site: "Brand + Site", test_package: "Test Package",
  spark_identity: "Spark Identity", ignite_brand: "Ignite Brand System", forge_identity: "Forge Complete Identity",
  packaging_single: "Packaging — Single SKU", packaging_system: "Packaging — Multi-SKU System",
  photo_starter: "AI Photography — Starter", photo_pro: "AI Photography — Pro", photo_campaign: "AI Photography — Campaign",
  merch_single: "Merch Design — Single Item", merch_line: "Merch Design — Full Line",
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

    const basePrice = (intake.package_price as number) > 0
      ? (intake.package_price as number)
      : (BASE_PRICES[pkg] ?? 0);

    const pages = (intake.pages as string[]) ?? [];
    const integrations = (intake.integrations as string[]) ?? [];
    const extraPageCount = Math.max(0, pages.length - INCLUDED_PAGES);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = [];

    // Base package
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: basePrice * 100,
        product_data: {
          name: `${PACKAGE_LABELS[pkg] ?? pkg} — Wood Fired Designs`,
          description: `${businessName}`,
        },
      },
      quantity: 1,
    });

    // Extra pages
    if (extraPageCount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: EXTRA_PAGE_PRICE * 100,
          product_data: { name: `Additional Pages (+${extraPageCount})` },
        },
        quantity: extraPageCount,
      });
    }

    // Integrations
    for (const integration of integrations.filter(i => i !== "None needed")) {
      const price = INTEGRATION_PRICES[integration];
      if (price) {
        lineItems.push({
          price_data: {
            currency: "usd",
            unit_amount: price * 100,
            product_data: { name: integration },
          },
          quantity: 1,
        });
      }
    }

    const subtotal = lineItems.reduce((s: number, item: any) => {
      return s + ((item.price_data.unit_amount as number) * (item.quantity as number));
    }, 0) / 100;

    if (subtotal === 0) {
      return NextResponse.json({ error: "Could not calculate project price. Contact michael@woodfireddesigns.com." }, { status: 400 });
    }

    const origin = req.nextUrl.origin;

    if (paymentType === "deposit") {
      const depositAmount = Math.round(subtotal * 0.5);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: intake.email as string,
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: depositAmount * 100,
            product_data: {
              name: `50% Project Deposit — ${PACKAGE_LABELS[pkg] ?? pkg}`,
              description: `${businessName} · Remaining $${depositAmount.toLocaleString()} due at delivery`,
            },
          },
          quantity: 1,
        }],
        metadata: { intake_id: intakeId, payment_type: "deposit" },
        success_url: `${origin}/portal/${intake.portal_token}?paid=1`,
        cancel_url: `${origin}/portal/${intake.portal_token}/pay`,
      });

      await supabase.from("intake_forms").update({ stripe_session_id: session.id }).eq("id", intakeId);
      return NextResponse.json({ url: session.url });

    } else {
      // Full payment with 5% discount as a coupon
      const coupon = await stripe.coupons.create({
        percent_off: 5,
        duration: "once",
        name: "Full Payment — 5% Discount",
      });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: intake.email as string,
        line_items: lineItems,
        discounts: [{ coupon: coupon.id }],
        metadata: { intake_id: intakeId, payment_type: "full" },
        success_url: `${origin}/portal/${intake.portal_token}?paid=1`,
        cancel_url: `${origin}/portal/${intake.portal_token}/pay`,
      });

      await supabase.from("intake_forms").update({ stripe_session_id: session.id }).eq("id", intakeId);
      return NextResponse.json({ url: session.url });
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
