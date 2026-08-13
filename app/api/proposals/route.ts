import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * This route writes proposals, clients and projects, so it cannot stay open to
 * the internet now that project workspaces call it remotely.
 *
 * Two kinds of caller, two rules:
 *   - The proposal builder at /proposal. A same-origin browser fetch, already
 *     behind Vercel SSO. `sec-fetch-site` is set by the browser and cannot be
 *     forged by page script, so it is a usable signal here.
 *   - Anything else (the wfd-contract CLI, scripts, other workspaces). Must
 *     present the shared key.
 *
 * With WFD_API_KEY unset the route stays open, so existing deploys keep
 * working; set it in Vercel to close it.
 */
function authorized(req: NextRequest): boolean {
  const key = process.env.WFD_API_KEY;
  if (!key) return true;
  if (req.headers.get("sec-fetch-site") === "same-origin") return true;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === key;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <WFD_API_KEY>." },
      { status: 401 }
    );
  }
  // Service role, not anon. `proposals` has RLS enabled with no policies at all,
  // and `projects` has no anon INSERT policy, so the anon client silently failed
  // both writes -- the same RLS trap that stopped contract signing persisting.
  let supabase: ReturnType<typeof supabaseAdmin>;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      clientName, company, email, phone, businessType,
      lineItems, scopeNotes, rushFee, subtotal, savings, total,
      bundleLabel, projectedStart, budgetRange,
    } = body;

    // 1. Insert proposal
    const { data: proposal, error: propErr } = await supabase
      .from("proposals")
      .insert({
        client_name: clientName,
        company: company || null,
        email,
        phone: phone || null,
        business_type: businessType || null,
        line_items: lineItems,
        scope_notes: scopeNotes,
        rush_fee: rushFee,
        subtotal,
        savings,
        total,
        bundle_label: bundleLabel || null,
        projected_start: projectedStart || null,
        budget_range: budgetRange || null,
        status: "sent",
      })
      .select()
      .single();

    if (propErr) throw propErr;

    // 2. Upsert client row (by email)
    const { data: client } = await supabase
      .from("clients")
      .upsert(
        {
          name: company || clientName,
          contact_name: clientName,
          email,
          phone: phone || null,
          source: "proposal_builder",
          is_active: true,
          mrr_status: "none",
          mrr_amount: 0,
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select()
      .single();

    // 3. Create draft project
    const primaryService = lineItems[0];
    const projectName = primaryService
      ? `${primaryService.label} — ${company || clientName}`
      : `New Project — ${company || clientName}`;

    const deliverables = lineItems.flatMap(
      (item: { deliverables?: string[]; label: string }) =>
        (item.deliverables ?? []).map((d: string) => ({
          id: crypto.randomUUID(),
          text: d,
          done: false,
        }))
    );

    const { data: project } = await supabase
      .from("projects")
      .insert({
        client_id: client?.id ?? null,
        name: projectName,
        status: "discovery",
        value: total,
        paid: false,
        deliverables,
        notes: `Proposal ID: ${proposal.id}\nScope: ${lineItems.map((i: { label: string }) => i.label).join(", ")}`,
      })
      .select()
      .single();

    // 4. Link project back to proposal
    if (project) {
      await supabase
        .from("proposals")
        .update({ project_id: project.id })
        .eq("id", proposal.id);
    }

    return NextResponse.json({ proposalId: proposal.id, projectId: project?.id });
  } catch (err) {
    // String(err) on a Supabase error object yields "[object Object]", which is
    // what this route reported for every failure and why the RLS denial above
    // went unnoticed. Pull the message out deliberately.
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
    console.error("proposal create:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
