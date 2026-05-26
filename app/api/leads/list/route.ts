import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { searchParams } = req.nextUrl;
  const grade = searchParams.get("grade");
  const state = searchParams.get("state");
  const hasEmail = searchParams.get("hasEmail");

  // Paginate through all rows (Supabase default cap is 1000)
  const leads: unknown[] = [];
  const PAGE = 1000;
  let offset = 0;

  while (true) {
    let query = sb
      .from("roofing_leads")
      .select(
        "id,business_name,website_url,email,phone,city,state,score,grade,brand_primary_color,slug,sequence_status,sequence_step,last_outreach_at,next_outreach_at,response_received,click_count,open_count,owner_name,google_review_count,google_star_rating"
      )
      .range(offset, offset + PAGE - 1)
      .order("score", { ascending: false });

    if (grade && grade !== "all") query = query.eq("grade", grade);
    if (state && state !== "all") query = query.eq("state", state);
    if (hasEmail === "1") query = query.not("email", "is", null);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) break;
    leads.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return NextResponse.json({ leads });
}
