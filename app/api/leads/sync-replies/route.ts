import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch all active leads that haven't been marked replied yet
  const { data: leads, error } = await supabase
    .from("roofing_leads")
    .select("id, email, sequence_status")
    .eq("sequence_status", "active")
    .not("email", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // In production this would check Microsoft Graph / IMAP for reply threads.
  // For now we return the count so the UI can refresh.
  return NextResponse.json({ checked: leads?.length ?? 0, synced_at: new Date().toISOString() });
}
