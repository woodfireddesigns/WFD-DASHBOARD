import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendQuestionnaireStarted } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PACKAGE_PRICES: Record<string, number> = {
  pp_brand_foundation: 3500,
  pp_full_system:      4300,
  pp_pitch_deck:       1500,
  pp_bundle:           5550,
  il_full_launch:      2400,
};

const PACKAGE_LABELS: Record<string, string> = {
  pp_brand_foundation: "Pitcher & Pour — Brand Foundation",
  pp_full_system:      "Pitcher & Pour — Full System",
  pp_pitch_deck:       "Pitcher & Pour — Pitch Deck",
  pp_bundle:           "Pitcher & Pour — Full System + Pitch Deck Bundle",
  il_full_launch:      "Indigo Leather — Full Brand & Commerce Launch",
};

const BUSINESS_NAMES: Record<string, string> = {
  pp_brand_foundation: "Pitcher & Pour",
  pp_full_system:      "Pitcher & Pour",
  pp_pitch_deck:       "Pitcher & Pour",
  pp_bundle:           "Pitcher & Pour",
  il_full_launch:      "Indigo Leather",
};

const PACKAGE_DELIVERABLES: Record<string, string[]> = {
  pp_bundle: [
    "Brand strategy brief + positioning document",
    "Primary wordmark — full lockup with icon and medallion mark system",
    "Secondary and stacked logo variants",
    "Typography system — headline, body, and label fonts for web, print, and packaging",
    "Full color palette — HEX, CMYK, and Pantone values",
    "Brand guidelines PDF — usage rules, dos/don'ts, application examples",
    "Field Gear sub-brand identity — full mark system",
    "Dual-channel co-existence rules (Pitcher & Pour + Field Gear)",
    "Crate packaging structure guidance",
    "15–20 slide Lowe's pitch deck built in your brand system — runs parallel to brand work",
    "Category argument structured for a Lowe's category buyer",
    "PDF export + editable deck source file (Keynote or PowerPoint)",
    "All source files — AI, EPS, SVG, PNG — full ownership transferred",
  ],
  pp_brand_foundation: [
    "Brand strategy brief + positioning",
    "Wordmark + icon + medallion mark system",
    "Typography system (web, print, packaging)",
    "Full color palette — HEX / CMYK / Pantone",
    "Brand guidelines PDF",
    "All source files — full ownership",
  ],
  pp_full_system: [
    "Brand strategy brief + positioning",
    "Wordmark + icon + medallion mark system",
    "Typography system (web, print, packaging)",
    "Full color palette — HEX / CMYK / Pantone",
    "Brand guidelines PDF",
    "Field Gear sub-brand identity",
    "Dual-channel co-existence rules (P&P + Field Gear)",
    "Crate packaging structure guidance",
    "All source files — full ownership",
  ],
  pp_pitch_deck: [
    "15–20 slide Lowe's pitch deck",
    "Brand story + product hierarchy",
    "Category argument for Lowe's buyer",
    "PDF export + editable source file",
  ],
  il_full_launch: [
    "AI-directed product photography — hero, flatlay, detail, and lifestyle shots",
    "Brand copy — tagline, voice guide, product descriptions, page copy, SEO metadata",
    "Headless Zoho Commerce store — account setup, product catalog, payment gateway, domain + SSL",
    "Custom front-end design — homepage, collection pages, product page templates",
    "Mobile-responsive across all devices, performance-optimized",
    "Navigation architecture — intuitive, minimal, conversion-focused",
    "Pre-launch QA across browsers and devices",
    "30-minute owner walkthrough + documentation for managing products",
    "Full ownership — all files, store credentials, source code transferred",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name = "", email, phone = "", package: pkg } = await req.json();

    if (!first_name || !email || !pkg) {
      return NextResponse.json({ error: "first_name, email, and package are required" }, { status: 400 });
    }

    if (!PACKAGE_PRICES[pkg]) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const packagePrice = PACKAGE_PRICES[pkg];
    const clientName = `${first_name} ${last_name}`.trim();
    const businessName = BUSINESS_NAMES[pkg] ?? "Direct Proposal";

    // 1. Create intake — already submitted, waiting on contract
    const { data: intake, error: intakeErr } = await supabase
      .from("intake_forms")
      .insert({
        first_name,
        last_name: last_name || "",
        email,
        phone: phone || null,
        business_name: businessName,
        package: pkg,
        package_price: packagePrice,
        status: "submitted",
        referral_source: "direct_proposal",
      })
      .select()
      .single();

    if (intakeErr) throw new Error(intakeErr.message ?? JSON.stringify(intakeErr));

    // 2. Upsert client
    const { data: client } = await supabase
      .from("clients")
      .upsert(
        {
          name: businessName,
          contact_name: clientName,
          email,
          source: "proposal",
          is_active: true,
          mrr_status: "none",
          mrr_amount: 0,
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select()
      .single();

    // 3. Build deliverables
    const deliverables = (PACKAGE_DELIVERABLES[pkg] ?? []).map((text) => ({
      id: crypto.randomUUID(),
      text,
      done: false,
    }));

    // 4. Create project
    const { data: project } = await supabase
      .from("projects")
      .insert({
        client_id: client?.id ?? null,
        name: `${PACKAGE_LABELS[pkg]} — ${businessName}`,
        status: "discovery",
        value: packagePrice,
        paid: false,
        deliverables,
        notes: `Direct proposal intake — no questionnaire. Package: ${PACKAGE_LABELS[pkg]}`,
      })
      .select()
      .single();

    // 5. Link back
    if (project || client) {
      await supabase
        .from("intake_forms")
        .update({ project_id: project?.id ?? null, client_id: client?.id ?? null })
        .eq("id", intake.id);
    }

    // Notify Michael
    sendQuestionnaireStarted({
      name: clientName,
      business: businessName,
      email,
      phone: "",
      package: PACKAGE_LABELS[pkg],
      total: packagePrice,
      portalToken: intake.portal_token,
      answers: { package: pkg, source: "direct_proposal" },
    }).catch((e) => console.error("RESEND ERROR:", JSON.stringify(e)));

    return NextResponse.json({
      portalToken: intake.portal_token,
      projectId: project?.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
