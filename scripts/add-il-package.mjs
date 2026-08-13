// Run once: node scripts/add-il-package.mjs
// Adds il_full_launch to the intake_forms package check constraint.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      const k = l.slice(0, idx).trim();
      const v = l.slice(idx + 1).trim().replace(/^["']|["']$/g, "").replace(/\r$/, "");
      return [k, v];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const sql = `
  ALTER TABLE intake_forms DROP CONSTRAINT IF EXISTS intake_forms_package_check;

  ALTER TABLE intake_forms ADD CONSTRAINT intake_forms_package_check
    CHECK (package IN (
      'starter_site', 'full_website', 'brand_and_site', 'test_package',
      'spark_identity', 'ignite_brand', 'forge_identity',
      'packaging_single', 'packaging_system',
      'photo_starter', 'photo_pro', 'photo_campaign',
      'merch_single', 'merch_line',
      'pp_brand_foundation', 'pp_full_system', 'pp_pitch_deck', 'pp_bundle',
      'il_full_launch'
    ));
`;

const { error } = await supabase.rpc("exec_sql", { query: sql }).catch(() => ({ error: "rpc_unavailable" }));

if (error === "rpc_unavailable" || error?.message?.includes("exec_sql")) {
  // Fall back to raw REST if exec_sql RPC doesn't exist
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    // exec_sql RPC likely doesn't exist — print manual instructions
    console.log("\n── exec_sql RPC not available ──");
    console.log("Run this in your Supabase SQL editor instead:\n");
    console.log(sql);
    process.exit(0);
  }
  console.log("✓ Constraint updated via RPC.");
} else if (error) {
  console.error("Error:", error);
  process.exit(1);
} else {
  console.log("✓ il_full_launch added to intake_forms package constraint.");
}
