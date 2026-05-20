import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { intakeId, paymentType } = await req.json();

    const { data: intake } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();

    if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const total = intake.package_price as number;
    const clientName = `${intake.first_name} ${intake.last_name}`;
    const packageLabels: Record<string, string> = {
      starter_site: "Starter Site",
      full_website: "Full Website",
      brand_and_site: "Brand + Site",
    };
    const packageLabel = packageLabels[intake.package] ?? intake.package;

    let amount: number;
    let description: string;

    if (paymentType === "deposit") {
      amount = Math.round(total * 0.5 * 100); // 50% in cents
      description = `${packageLabel} — 50% Deposit`;
    } else {
      amount = Math.round(total * 0.95 * 100); // 5% discount in cents
      description = `${packageLabel} — Full Payment (5% discount applied)`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: intake.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: description,
              description: `Wood Fired Designs · ${clientName}${intake.business_name ? ` · ${intake.business_name}` : ""}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        intake_id: intakeId,
        payment_type: paymentType,
        portal_token: intake.portal_token,
      },
      success_url: `${req.nextUrl.origin}/portal/${intake.portal_token}?paid=1`,
      cancel_url: `${req.nextUrl.origin}/portal/${intake.portal_token}/pay`,
    });

    // Store session ID
    await supabase
      .from("intake_forms")
      .update({ stripe_session_id: session.id })
      .eq("id", intakeId);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
