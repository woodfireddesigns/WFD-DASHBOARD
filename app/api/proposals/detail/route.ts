import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read a proposal for the public contract page.
 *
 * Goes through the server because `proposals` is RLS-locked with no anon
 * policy. Knowing the proposal UUID is the capability; only presentational
 * fields are returned, never internal pipeline data like budget_range.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Fail closed on a malformed id rather than handing Postgres bad input.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("proposals")
      .select(
        "id, created_at, client_name, company, email, line_items, scope_notes, rush_fee, subtotal, savings, total, bundle_label, projected_start, status, signed_name, signed_at, deposit_amount, deposit_label, contract_pdf_url, stripe_payment_link"
      )
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("proposal detail:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
