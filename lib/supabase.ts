import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Types ────────────────────────────────────────────────────────────────────

export type TradesStage =
  | "scraped"
  | "outreach_active"
  | "responded"
  | "call_booked"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";

export type InboundStage =
  | "new"
  | "qualified"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";

export interface TradesLead {
  id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  grade: "A" | "B" | "C" | "ungraded";
  score: number;
  pipeline_stage: TradesStage;
  sequence_status: string;
  sequence_step: number;
  outreach_sent: boolean;
  response_received: boolean;
  total_emails_sent: number;
  open_count: number;
  click_count: number;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  notes: string | null;
  last_outreach_at: string | null;
  next_outreach_at: string | null;
  slug: string | null;
}

export interface InboundLead {
  id: string;
  created_at: string;
  name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  referred_by: string | null;
  service_interest: string[] | null;
  notes: string | null;
  pipeline_stage: InboundStage;
  budget_estimate: string | null;
  city: string | null;
  state: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
}

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
  client?: Client;
}
