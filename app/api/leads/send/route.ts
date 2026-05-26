import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/graph";

const STEP_DELAYS = [0, 3, 2]; // days after each step before next is due

// Blocklists for name validation
const GENERIC_EMAIL_PREFIXES = new Set([
  "info","hello","contact","admin","office","mail","support","team","sales",
  "no","noreply","reply","billing","accounts","accounts","service","services",
  "help","enquiries","enquiry","inquiry","inquiries","jobs","careers","pr",
  "media","press","news","marketing","reception","manager","owner","ops",
  "operations","corp","corporate","webmaster","postmaster","abuse","privacy",
]);

// Common last-name-only patterns from email prefixes (surname signals)
const SURNAME_SIGNALS = /^(mc|mac|van|de|del|la|le|st|o'|al)[a-z]+$/i;

function looksLikeName(raw: string): string | null {
  const s = raw.replace(/[^a-zA-Z]/g, "").toLowerCase();
  // Too short or too long to be a first name
  if (s.length < 2 || s.length > 12) return null;
  // Single letter
  if (s.length === 1) return null;
  // All same character
  if (/^(.)\1+$/.test(s)) return null;
  // Generic inbox name
  if (GENERIC_EMAIL_PREFIXES.has(s)) return null;
  // Looks like a surname prefix pattern
  if (SURNAME_SIGNALS.test(s)) return null;
  // All uppercase with 2+ chars is likely an abbreviation or last name (e.g. "AR", "JB")
  if (raw === raw.toUpperCase() && raw.length <= 3) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFirstName(lead: Record<string, string | null>): string | null {
  // 1. owner_name field — most reliable
  if (lead.owner_name) {
    const parts = lead.owner_name.trim().split(/\s+/);
    const first = parts[0];
    // If it looks like an initial (single char or "J.") skip
    if (first.replace(/\./g, "").length <= 1) return null;
    const result = looksLikeName(first);
    if (result) return result;
  }
  // 2. Email prefix — extract first segment before dots/underscores
  if (lead.email) {
    const prefix = lead.email.split("@")[0];
    // Try first segment (e.g. "john" from "john.smith@...")
    const firstSegment = prefix.split(/[._\-+]/)[0];
    const result = looksLikeName(firstSegment);
    if (result) return result;
  }
  return null;
}

function buildEmail(lead: Record<string, string | null>, step: number) {
  const name = getFirstName(lead);
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewUrl = `https://app.woodfireddesigns.com/roofing/${lead.slug}`;
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://wfd-dashboard.vercel.app";
  const trackingPixelUrl = `${baseUrl}/api/leads/track?id=${lead.id}&step=${step}&event=open`;

  const city = lead.city || "your area";
  const biz  = lead.business_name || "your business";

  const subjects: Record<number, string> = {
    1: lead.website_url
      ? `I built something for ${biz}`
      : `Free website preview — ${biz}`,
    2: name ? `Did you see this, ${name}?` : `Did you see this?`,
    3: `Last one from me — ${biz}`,
  };

  const bodies: Record<number, string> = {
    1: lead.website_url
      // Has a website — upgrade pitch
      ? `${greeting}\n\nI build websites for roofing companies and came across ${biz} while researching contractors in ${city}.\n\nI put together a faster, more modern version of your site — took me a few hours. Thought it was worth showing you before I moved on.\n\nTake a look:\n${previewUrl}\n\nHappy to walk you through it if you're curious.\n\nMichael\nWood Fired Designs\n\nP.S. Not interested? Just say the word and I won't reach out again.`
      // No website — new site pitch
      : `${greeting}\n\nI noticed ${biz} doesn't have a website yet. Most of your competitors in ${city} do — and that's where homeowners are searching first.\n\nI built a free preview to show you what one could look like:\n${previewUrl}\n\nTakes 30 seconds to look at. No strings attached.\n\nMichael\nWood Fired Designs\n\nP.S. Not interested? Just let me know and I'll leave you alone.`,

    // Follow-up — reference the preview, add urgency
    2: `${greeting}\n\nSending a quick follow-up on the site preview I built for ${biz}:\n${previewUrl}\n\nIf you liked it, I can have a custom version live within a week. If the timing's off, no problem — just let me know and I'll check back later.\n\nMichael`,

    // Final touch — short, no pressure
    3: `${greeting}\n\nLast message from me on this — I know your inbox is busy.\n\nHere's the preview I built for ${biz} one more time:\n${previewUrl}\n\nIf you ever want to talk about getting a site like this live, I'm here. If not, I wish you a great season.\n\nMichael`,
  };

  return { subject: subjects[step], body: bodies[step], trackingPixelUrl };
}

export async function POST(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  // Fetch lead
  const { data: lead, error: fetchErr } = await sb
    .from("roofing_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (!lead.email) return NextResponse.json({ error: "Lead has no email" }, { status: 400 });
  if (!lead.slug)  return NextResponse.json({ error: "Lead has no preview (slug missing)" }, { status: 400 });

  const step = (lead.sequence_step ?? 0) + 1;
  if (step > 3)    return NextResponse.json({ error: "Sequence complete" }, { status: 400 });

  const { subject, body, trackingPixelUrl } = buildEmail(lead, step);

  // Send via Microsoft Graph
  try {
    await sendMail({ to: lead.email, subject, body, trackingPixelUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Graph sendMail failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Update sequence state
  const isComplete = step >= 3;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (STEP_DELAYS[step] ?? 2));
  nextDate.setHours(12, 0, 0, 0);

  await sb.from("roofing_leads").update({
    sequence_status: isComplete ? "completed" : "active",
    sequence_step: step,
    last_outreach_at: new Date().toISOString(),
    next_outreach_at: isComplete ? null : nextDate.toISOString(),
    outreach_sent: true,
    outreach_date: new Date().toISOString().split("T")[0],
  }).eq("id", lead.id as string);

  return NextResponse.json({ ok: true, step, email: lead.email });
}
