import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 *
 * Why this exists: `proposals` has RLS enabled with no policies, and `invoices`
 * / `invoice_items` are service-role only. The anon key cannot read or write
 * any of them, which is why the browser-side contract signing never persisted
 * anything. Contract execution and invoice creation now run through here.
 *
 * NEVER import this into a client component — the key bypasses all RLS.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseAdmin() {
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it from Supabase → Project Settings → API → service_role, " +
        "to .env.local and to the Vercel project env."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasServiceRole(): boolean {
  return Boolean(url && serviceKey);
}
