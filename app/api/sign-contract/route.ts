import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendContractSigned } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PACKAGE_LABELS: Record<string, string> = {
  starter_site: "Starter Site",
  full_website: "Full Website",
  brand_and_site: "Brand + Site",
  test_package: "Test Package",
};

export async function POST(req: NextRequest) {
  try {
    const { intakeId, signedName } = await req.json();

    const { data: intake, error } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();

    if (error || !intake) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const signedAt = new Date().toISOString();

    await supabase.from("intake_forms").update({
      status: "signed",
      signed_name: signedName,
      signed_at: signedAt,
    }).eq("id", intakeId);

    // Create invoice row
    await supabase.from("invoices").insert({
      client_name: `${intake.first_name} ${intake.last_name}`.trim(),
      company: intake.business_name || null,
      email: intake.email,
      proposal_id: intakeId,
      amount: intake.package_price,
      status: "draft",
      line_items: [{ description: PACKAGE_LABELS[intake.package as string] ?? intake.package, qty: 1, rate: intake.package_price, total: intake.package_price }],
      notes: `Signed by ${signedName} on ${new Date(signedAt).toLocaleDateString()}`,
    });

    // Send notification (non-blocking)
    sendContractSigned({
      name: `${intake.first_name} ${intake.last_name}`.trim(),
      business: (intake.business_name as string) ?? "",
      email: intake.email as string,
      package: PACKAGE_LABELS[intake.package as string] ?? (intake.package as string),
      total: intake.package_price as number,
      signedName,
      portalToken: intake.portal_token as string,
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
