import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id    = searchParams.get("id");
  const event = searchParams.get("event");

  if (id && (event === "open" || event === "click")) {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data } = await sb
      .from("roofing_leads")
      .select("open_count, click_count")
      .eq("id", id)
      .single();

    if (data) {
      if (event === "open") {
        await sb.from("roofing_leads").update({
          open_count: (data.open_count ?? 0) + 1,
          last_opened_at: new Date().toISOString(),
        }).eq("id", id);
      } else {
        await sb.from("roofing_leads").update({
          click_count: (data.click_count ?? 0) + 1,
          last_clicked_at: new Date().toISOString(),
        }).eq("id", id);
      }
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
