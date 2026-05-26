import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/graph";

const STEP_DELAYS = [0, 3, 2]; // days after each step before next is due

function getFirstName(lead: Record<string, string | null>): string | null {
  if (lead.owner_name) return lead.owner_name.split(" ")[0];
  if (lead.email) {
    const part = lead.email.split("@")[0].split(/[._\-+]/)[0].replace(/[^a-zA-Z]/g, "");
    const generic = ["info","hello","contact","admin","office","mail","support","team","sales","no","noreply"];
    if (part.length >= 3 && !generic.includes(part.toLowerCase())) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
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

  const subjects: Record<number, string> = {
    1: `Question regarding ${lead.business_name}`,
    2: `Quick follow up - ${lead.business_name}`,
    3: `One last thing for ${lead.business_name}`,
  };

  const bodies: Record<number, string> = {
    1: lead.website_url
      ? `${greeting}\n\nI was looking at your website and noticed the mobile performance could be improved. I went ahead and built a high-speed preview of what a modern version of ${lead.business_name} could look like for the ${lead.city} market.\n\nYou can view the live preview here:\n${previewUrl}\n\nWhat do you think of the new look and the load speed?\n\nBest,\nMichael\n\nP.S. If you'd rather not hear from me again, just let me know and I'll remove you from my list.`
      : `${greeting}\n\nI was researching roofing companies in the ${lead.city} area and noticed ${lead.business_name} doesn't have a website yet. I went ahead and built a free preview of what a modern site could look like for your business.\n\nLive preview:\n${previewUrl}\n\nA site like this could help you stand out and capture more leads in ${lead.city}.\n\nBest,\nMichael\n\nP.S. If you'd rather not hear from me again, just let me know and I'll remove you from my list.`,
    2: `${greeting}\n\nJust following up to see if you had a second to check out that site preview I sent over:\n${previewUrl}\n\nI'm curious if you think a design like this would help you stand out from the other roofers in ${lead.city}. If you like it, I'd love to show you how we can get it live.\n\nBest,\nMichael`,
    3: `${greeting}\n\nI'll keep this brief — here's the preview I built for ${lead.business_name}:\n${previewUrl}\n\nIf you're looking to upgrade your online presence this season, I'd love to chat. If not, no worries. The link stays live.\n\nBest,\nMichael`,
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
