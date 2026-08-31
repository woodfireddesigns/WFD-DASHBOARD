import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * The browser client for every dashboard page.
 *
 * createBrowserClient, not createClient: it stores the session in a cookie the
 * server can also read, so the proxy can check the session and PostgREST sees
 * the signed-in user's JWT rather than the bare anon key.
 *
 * That distinction was the whole bug. With the plain client the dashboard spoke
 * to Postgres as `anon`, which has no policies on tasks, invoices, habits or
 * notifications -- so reads returned nothing and writes were discarded without
 * an error. Adding a task did nothing, and the UI had no way to know.
 *
 * Every dashboard page imports this one instance, so signing in fixes all of
 * them at once.
 */
export const supabase = createBrowserClient(url, key);

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * The pipeline's types live in lib/pipeline.ts. Four types used to sit here,
 * pinning every stage into a TypeScript union so the columns could not be
 * changed without changing types. `Deal` replaces all four.
 */

export type ProjectStatus =
  | "discovery" | "design" | "build" | "review" | "delivered" | "paused" | "cancelled";

export type ProjectType =
  | "brand_identity" | "website" | "packaging" | "photography"
  | "merch" | "landing_page" | "social_campaign" | "ad_creative" | "other";

export interface Deliverable {
  id: string;
  text: string;
  done: boolean;
}

export interface Client {
  id: string;
  created_at: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  tier: string | null;
  mrr_status: "none" | "active" | "paused" | "churned";
  mrr_amount: number;
  source: string | null;
  notes: string | null;
  is_active: boolean;
}

/**
 * How a project bills.
 *
 * one_time: `value` is the whole contract.
 * retainer: `value` is the monthly amount, and it recurs until the project
 * leaves an active status. The distinction matters because the old Projects
 * header summed every project's value into one "Unpaid" figure, which counted
 * a $2,000/mo retainer as a $2,000 debt and a paid deposit as money owed.
 */
export type BillingType = "one_time" | "retainer";

/** Who the project is parked on. null means it is actually moving. */
export type BlockedOn = "me" | "client";

export interface Project {
  id: string;
  created_at: string;
  client_id: string;
  name: string;
  type: ProjectType | null;
  status: ProjectStatus;
  deadline: string | null;
  delivered_at: string | null;
  value: number | null;
  paid: boolean;
  notes: string | null;
  deliverables: Deliverable[];
  billing_type: BillingType;
  /** Dollars earned but not yet billed — a milestone hit, a month delivered. */
  to_invoice: number;
  to_invoice_note: string | null;
  blocked_on: BlockedOn | null;
  blocked_note: string | null;
  client?: Client;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export type TaskTier = "main" | "secondary" | "daily";

/**
 * daily    — every day
 * weekdays — Monday to Friday
 * weekly   — only the ISO weekday numbers listed in `weekdays` (1 = Mon .. 7 = Sun)
 */
export type Cadence = "daily" | "weekdays" | "weekly";

export interface TaskTemplate {
  id: string;
  created_at: string;
  text: string;
  tier: TaskTier;
  project: string | null;
  cadence: Cadence;
  weekdays: number[];
  estimate_minutes: number | null;
  sort_order: number;
  active: boolean;
}

export interface Task {
  id: string;
  created_at: string;
  text: string;
  tier: TaskTier;
  status: "todo" | "done";
  project: string | null;
  sort_order: number;
  date: string;
  done_at: string | null;
  template_id: string | null;
  estimate_minutes: number | null;
}
