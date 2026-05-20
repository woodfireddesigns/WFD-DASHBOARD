import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
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
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
