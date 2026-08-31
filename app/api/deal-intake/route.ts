import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendDealCaptured } from "@/lib/email";

// Service role, matching the other intake routes. The anon key has no insert
// policy on deals, so falling back to it would drop enquiries silently.
const supabase = supabaseAdmin();

type Kind = "audit" | "retainer";

const META: Record<Kind, { tag: string; label: string }> = {
  audit:    { tag: "Brand & Site Audit", label: "Free audit request" },
  retainer: { tag: "Monthly Retainer",   label: "Retainer enquiry" },
};

/**
 * deals.source is a closed vocabulary — it answers "where did this
 * person come from", not "which form did they fill in". Which form they used is
 * carried in service_interest and the notes instead.
 */
const SOURCES = ["referral", "instagram", "website", "contra", "cold_dm", "other"] as const;

function toSource(referral: string): (typeof SOURCES)[number] {
  const v = referral.trim().toLowerCase();
  if (v === "") return "website";
  if (v.includes("referral") || v.includes("friend") || v.includes("existing client")) return "referral";
  if (v.includes("instagram")) return "instagram";
  if (v.includes("dm") || v.includes("cold")) return "cold_dm";
  if (v.includes("contra")) return "contra";
  if (v.includes("google") || v.includes("search") || v.includes("website")) return "website";
  return "other";
}

/**
 * Top-of-funnel capture.
 *
 * These land in deals rather than intake_forms because nothing has been
 * scoped or priced yet — an audit request is a conversation, not a contract, and
 * putting it through /api/intake would have spawned a draft project and a client
 * record for every curious visitor.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const kind = body.kind === "retainer" ? "retainer" : "audit";
    const meta = META[kind as Kind];

    const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
    const list = (k: string) => (Array.isArray(body[k]) ? (body[k] as string[]) : []);

    const name = [s("first_name"), s("last_name")].filter(Boolean).join(" ");
    const email = s("email");
    if (email === "") {
      return NextResponse.json({ error: "An email address is required." }, { status: 400 });
    }

    // Everything that is not a known column becomes readable notes rather than
    // being dropped — the answers are the reason to call these people back.
    const KNOWN = new Set([
      "kind", "first_name", "last_name", "business_name", "email", "phone",
      "website_url", "referral_source", "budget", "services", "city", "state",
    ]);
    const notes = Object.entries(body)
      .filter(([k, v]) => !KNOWN.has(k) && v !== "" && v !== null && v !== undefined)
      .map(([k, v]) => {
        const pretty = k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
        return `${pretty}: ${Array.isArray(v) ? v.join(", ") : String(v)}`;
      });

    if (s("website_url")) notes.unshift(`Website: ${s("website_url")}`);
    notes.unshift(meta.label);

    const { data, error } = await supabase
      .from("deals")
      .insert({
        name: name || null,
        business_name: s("business_name") || null,
        email,
        phone: s("phone") || null,
        source: toSource(s("referral_source")),
        referred_by: s("referral_source") || null,
        // The form is the first tag, so a glance at the Pipeline card tells you
        // whether this person asked for a free audit or a monthly retainer.
        service_interest: [meta.tag, ...list("services")],
        budget_estimate: s("budget") || null,
        city: s("city") || null,
        state: s("state") || null,
        notes: notes.join("\n"),
        stage: "new",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Non-blocking: a Resend outage should not cost the enquiry.
    sendDealCaptured({
      name,
      business: s("business_name"),
      email,
      phone: s("phone"),
      source: meta.tag,
      headline: kind === "audit"
        ? `Wants a look at ${s("website_url") || "their brand"}.`
        : `Asking about a monthly retainer.`,
      detail: Object.fromEntries(
        Object.entries(body)
          .filter(([k]) => !["kind", "first_name", "last_name", "email", "phone", "business_name"].includes(k))
          .map(([k, v]) => [
            k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
            Array.isArray(v) ? v.join(", ") : String(v ?? ""),
          ])
      ),
    }).catch((e) => console.error("RESEND ERROR:", e));

    return NextResponse.json({ dealId: data.id });
  } catch (err) {
    console.error("deal-intake:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
