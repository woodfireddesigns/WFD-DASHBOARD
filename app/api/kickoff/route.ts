import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendKickoffReceived } from "@/lib/email";

const supabase = supabaseAdmin();

/** Field key → the label it gets in the project notes. Order is the read order. */
const LABELS: [string, string][] = [
  ["decision_maker",   "Who signs off"],
  ["review_turnaround","Feedback turnaround they committed to"],
  ["hard_date",        "Hard date"],
  ["brand_assets",     "Brand files"],
  ["photography",      "Photography"],
  ["copy_status",      "Copy"],
  ["domain_registrar", "Domain registrar"],
  ["domain_access",    "Domain / DNS access"],
  ["platform_access",  "Platform logins"],
  ["existing_analytics","Analytics"],
  ["must_haves",       "Non-negotiables"],
  ["extra_notes",      "Anything else"],
];

/**
 * The kickoff pack.
 *
 * Everything here is a thing that has historically stalled a build for weeks —
 * DNS access, who actually signs off, where the logo files live. Collecting it
 * once, in writing, on the day the contract is signed is the whole point; the
 * answers get appended to the project so they are where the work is, not buried
 * in an inbox.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
    const list = (k: string) => (Array.isArray(body[k]) ? (body[k] as string[]) : []);

    const email = s("email");
    if (email === "") {
      return NextResponse.json({ error: "An email address is required." }, { status: 400 });
    }

    const name = [s("first_name"), s("last_name")].filter(Boolean).join(" ");
    const business = s("business_name");

    // Find the project. The link carries ?p=<id> when sent from the dashboard;
    // without it, fall back to the client's email so a forwarded link still lands.
    let projectId = s("project_id") || null;

    if (projectId === null) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("email", email).maybeSingle();
      if (client) {
        const { data: proj } = await supabase
          .from("projects")
          .select("id")
          .eq("client_id", client.id)
          .in("status", ["discovery", "design", "build", "review"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        projectId = proj?.id ?? null;
      }
    }

    const block = [
      `── Kickoff pack · ${new Date().toISOString().slice(0, 10)} ──`,
      `From: ${name || "—"} · ${email}`,
      ...LABELS
        .map(([key, label]) => {
          const raw = Array.isArray(body[key]) ? list(key).join(", ") : s(key);
          return raw === "" ? null : `${label}: ${raw}`;
        })
        .filter((line): line is string => line !== null),
    ].join("\n");

    let project: { id: string; name: string } | null = null;

    if (projectId !== null) {
      const { data: existing } = await supabase
        .from("projects").select("id, name, notes").eq("id", projectId).maybeSingle();

      if (existing) {
        // Appended, never overwritten — the brief already living in notes is
        // usually the more valuable half.
        await supabase
          .from("projects")
          .update({
            notes: existing.notes ? `${existing.notes}\n\n${block}` : block,
            blocked_on: null,
            blocked_note: null,
          })
          .eq("id", projectId);
        project = { id: existing.id, name: existing.name };
      }
    }

    // No project matched: keep it rather than lose it. It shows on the Pipeline
    // board where it will get looked at.
    if (project === null) {
      await supabase.from("deals").insert({
        name: name || null,
        business_name: business || null,
        email,
        phone: s("phone") || null,
        // source is a closed vocabulary on this table; the form is named in
        // service_interest, which is what the Pipeline card actually shows.
        source: "other",
        service_interest: ["Kickoff pack — no project matched"],
        notes: block,
        stage: "contacted",
      });
    }

    sendKickoffReceived({
      name, business, email,
      project: project?.name ?? "No project matched — filed on the Pipeline board",
      detail: Object.fromEntries(
        LABELS.map(([key, label]) => [
          label,
          Array.isArray(body[key]) ? list(key).join(", ") : s(key),
        ])
      ),
    }).catch((e) => console.error("RESEND ERROR:", e));

    return NextResponse.json({ projectId: project?.id ?? null });
  } catch (err) {
    console.error("kickoff:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
