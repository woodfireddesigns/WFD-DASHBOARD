import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PACKAGE_PRICES: Record<string, number> = {
  starter_site: 1200,
  full_website: 2400,
  brand_and_site: 4200,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pkg = body.package as string;
    const packagePrice = PACKAGE_PRICES[pkg] ?? 0;
    const clientName = `${body.first_name} ${body.last_name}`.trim();

    // 1. Save intake form
    const { data: intake, error: intakeErr } = await supabase
      .from("intake_forms")
      .insert({ ...body, package_price: packagePrice })
      .select()
      .single();

    if (intakeErr) throw intakeErr;

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
          source: body.referral_source || "onboarding",
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
    };

    const deliverables = [
      ...(baseDeliverables[pkg] ?? []),
      ...(body.pages ?? []).filter((p: string) => !["Home", "Contact"].includes(p)).map((p: string) => `${p} page`),
      ...(body.integrations ?? []).filter((i: string) => i !== "None").map((i: string) => `Integration: ${i}`),
    ].map((text: string) => ({ id: crypto.randomUUID(), text, done: false }));

    // 4. Create draft project
    const PACKAGE_LABELS: Record<string, string> = {
      starter_site: "Starter Site",
      full_website: "Full Website",
      brand_and_site: "Brand + Site",
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
