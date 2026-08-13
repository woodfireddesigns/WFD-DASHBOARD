import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendQuestionnaireStarted } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PACKAGE_PRICES: Record<string, number> = {
  starter_site: 1200, full_website: 2400, brand_and_site: 4200, test_package: 19,
  spark_identity: 1200, ignite_brand: 3500, forge_identity: 6500,
  packaging_single: 1200, packaging_system: 2800,
  photo_starter: 800, photo_pro: 1500, photo_campaign: 2800,
  merch_single: 800, merch_line: 1800,
  pp_brand_foundation: 3500, pp_full_system: 4300, pp_pitch_deck: 1500,
};
const INTEGRATION_PRICES: Record<string, number> = {
  "Online booking system": 400,
  "Email capture / newsletter": 200,
  "Online store": 600,
  "Social media feeds": 150,
  "Google Analytics": 0,
  "Chat widget": 200,
  "Payment processing": 400,
};
const EXTRA_PAGE_PRICE = 300;
const INCLUDED_PAGES = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pkg = body.package as string;
    const base = PACKAGE_PRICES[pkg] ?? 0;

    const pages = (body.pages ?? []) as string[];
    const extraPages = Math.max(0, pages.length - INCLUDED_PAGES) * EXTRA_PAGE_PRICE;

    const integrations = (body.integrations ?? []) as string[];
    const integrationTotal = integrations.reduce((s: number, i: string) => s + (INTEGRATION_PRICES[i] ?? 0), 0);

    const packagePrice = base + extraPages + integrationTotal;
    const clientName = `${body.first_name} ${body.last_name}`.trim();

    // 1. Save intake form (auto-sign test_package)
    const autoSign = pkg === "test_package";
    const { data: intake, error: intakeErr } = await supabase
      .from("intake_forms")
      .insert({
        ...body,
        package_price: packagePrice,
        status: autoSign ? "signed" : "submitted",
        signed_name: autoSign ? clientName : null,
        signed_at: autoSign ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (intakeErr) throw new Error(intakeErr.message ?? JSON.stringify(intakeErr));

    // 2. Upsert client
    const { data: client } = await supabase
      .from("clients")
      .upsert(
        {
          name: body.business_name || clientName,
          contact_name: clientName,
          email: body.email,
          phone: body.phone || null,
          city: body.city || null,
          state: body.state || null,
          source: "other",
          is_active: true,
          mrr_status: "none",
          mrr_amount: 0,
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select()
      .single();

    // 3. Build deliverables from package
    const baseDeliverables: Record<string, string[]> = {
      starter_site: [
        "Single-page website",
        "Mobile-optimized layout",
        "Contact form + click-to-call",
        "Google-ready setup",
        "Domain & hosting transfer support",
      ],
      full_website: [
        "Up to 5 pages",
        "SEO foundation setup",
        "Contact form + lead capture",
        "Services & portfolio pages",
        "Google Analytics + Search Console",
        "Full ownership transfer",
      ],
      brand_and_site: [
        "Logo & brand identity suite",
        "Color & typography system",
        "Brand guidelines document",
        "Up to 5 pages website",
        "SEO foundation setup",
        "Vehicle wrap / signage ready files",
        "Google Analytics + Search Console",
        "Full ownership transfer",
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
        "Dual-channel co-existence rules",
        "Crate packaging structure guidance",
        "All source files — full ownership",
      ],
      pp_pitch_deck: [
        "12–16 slide Lowe's pitch deck",
        "Brand story + product hierarchy",
        "Category argument for Lowe's buyer",
        "PDF export + editable source file",
      ],
    };

    const deliverables = [
      ...(baseDeliverables[pkg] ?? []),
      ...(body.pages ?? []).filter((p: string) => !["Home", "Contact"].includes(p)).map((p: string) => `${p} page`),
      ...(body.integrations ?? []).filter((i: string) => i !== "None").map((i: string) => `Integration: ${i}`),
    ].map((text: string) => ({ id: crypto.randomUUID(), text, done: false }));

    // 4. Create draft project
    const PACKAGE_LABELS: Record<string, string> = {
      starter_site: "Starter Site", full_website: "Full Website", brand_and_site: "Brand + Site", test_package: "Test Package",
      spark_identity: "Spark Identity", ignite_brand: "Ignite Brand System", forge_identity: "Forge Complete Identity",
      packaging_single: "Packaging — Single SKU", packaging_system: "Packaging — Multi-SKU System",
      photo_starter: "AI Photography — Starter", photo_pro: "AI Photography — Pro", photo_campaign: "AI Photography — Campaign",
      merch_single: "Merch Design — Single Item", merch_line: "Merch Design — Full Line",
      pp_brand_foundation: "P&P — Brand Foundation", pp_full_system: "P&P — Full System", pp_pitch_deck: "P&P — Pitch Deck",
    };

    const { data: project } = await supabase
      .from("projects")
      .insert({
        client_id: client?.id ?? null,
        name: `${PACKAGE_LABELS[pkg]} — ${body.business_name || clientName}`,
        status: "discovery",
        value: packagePrice,
        paid: false,
        deliverables,
        notes: `Intake ID: ${intake.id}\nGoal: ${body.primary_goal ?? ""}\nTimeline: ${body.launch_timeline ?? ""}`,
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

    // Fire notification (non-blocking)
    sendQuestionnaireStarted({
      name: clientName,
      business: body.business_name ?? "",
      email: body.email,
      phone: body.phone ?? "",
      package: PACKAGE_LABELS[pkg] ?? pkg,
      total: packagePrice,
      portalToken: intake.portal_token,
      answers: body,
    }).catch((e) => console.error("RESEND ERROR:", JSON.stringify(e)));

    return NextResponse.json({
      intakeId: intake.id,
      portalToken: intake.portal_token,
      projectId: project?.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
