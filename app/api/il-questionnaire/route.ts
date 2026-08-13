import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendQuestionnaireStarted } from "@/lib/email";

// Service role, with no anon fallback. Falling back meant a missing key
// downgraded this route to a client RLS denies, so intake silently stopped
// recording instead of failing loudly.
const supabase = supabaseAdmin();

const PACKAGE      = "il_full_launch";
const PACKAGE_LABEL = "Indigo Leather — Full Brand & Commerce Launch";
const PACKAGE_PRICE = 2400;
const BUSINESS_NAME = "Indigo Leather";

const DELIVERABLES = [
  "AI-directed product photography — hero, flatlay, detail, and lifestyle shots",
  "Brand copy — tagline, voice guide, product descriptions, page copy, SEO metadata",
  "Headless Zoho Commerce store — account setup, product catalog, payment gateway, domain + SSL",
  "Custom front-end design — homepage, collection pages, product page templates",
  "Mobile-responsive across all devices, performance-optimized",
  "Navigation architecture — intuitive, minimal, conversion-focused",
  "Pre-launch QA across browsers and devices",
  "30-minute owner walkthrough + documentation for managing products",
  "Full ownership — all files, store credentials, source code transferred",
];

function buildNotes(body: Record<string, string>): string {
  const fields: [string, string][] = [
    ["Origin story",        body.origin],
    ["Craft & process",     body.craft],
    ["Proudest piece",      body.proudest],
    ["Products",            body.products],
    ["Differentiator",      body.differentiator],
    ["Selling now",         body.selling_now],
    ["Price positioning",   body.price_position],
    ["Ideal customer",      body.ideal_customer],
    ["Customer feedback",   body.customer_feedback],
    ["Brand personality",   body.brand_personality],
    ["Brand words",         body.brand_words],
    ["Inspiration",         body.inspiration],
    ["Avoid",               body.avoid],
    ["12-month goal",       body.goal_12mo],
    ["5-year vision",       body.long_term],
    ["Extra notes",         body.extra],
  ];
  return fields
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}:\n${v}`)
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, string> = await req.json();

    const { firstName = "", lastName = "", email, phone = "" } = body;
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const clientName = `${firstName} ${lastName}`.trim();
    const notes = buildNotes(body);

    // 1. Create intake form
    const { data: intake, error: intakeErr } = await supabase
      .from("intake_forms")
      .insert({
        first_name: firstName,
        last_name:  lastName,
        email,
        phone:          phone || null,
        business_name:  BUSINESS_NAME,
        package:        PACKAGE,
        package_price:  PACKAGE_PRICE,
        status:         "submitted",
        referral_source: "direct_proposal",
        extra_notes:    notes,
      })
      .select()
      .single();

    if (intakeErr) throw new Error(intakeErr.message ?? JSON.stringify(intakeErr));

    // 2. Upsert client
    const { data: client } = await supabase
      .from("clients")
      .upsert(
        {
          name:         BUSINESS_NAME,
          contact_name: clientName,
          email,
          phone:        phone || null,
          source:       "proposal",
          is_active:    true,
          mrr_status:   "none",
          mrr_amount:   0,
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select()
      .single();

    // 3. Create project
    const deliverables = DELIVERABLES.map((text) => ({
      id:   crypto.randomUUID(),
      text,
      done: false,
    }));

    const { data: project } = await supabase
      .from("projects")
      .insert({
        client_id:   client?.id ?? null,
        name:        `${PACKAGE_LABEL} — ${BUSINESS_NAME}`,
        status:      "discovery",
        value:       PACKAGE_PRICE,
        paid:        false,
        deliverables,
        notes,
      })
      .select()
      .single();

    // 4. Link project + client back to intake
    if (project || client) {
      await supabase
        .from("intake_forms")
        .update({ project_id: project?.id ?? null, client_id: client?.id ?? null })
        .eq("id", intake.id);
    }

    // 5. Notify Michael
    sendQuestionnaireStarted({
      name:        clientName,
      business:    BUSINESS_NAME,
      email,
      phone,
      package:     PACKAGE_LABEL,
      total:       PACKAGE_PRICE,
      portalToken: intake.portal_token,
      answers:     body as Record<string, unknown>,
    }).catch((e) => console.error("RESEND ERROR:", JSON.stringify(e)));

    return NextResponse.json({
      portalToken: intake.portal_token,
      projectId:   project?.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
