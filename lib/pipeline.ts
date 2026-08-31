/**
 * The pipeline, and the one place it is defined.
 *
 * The old board was two boards side by side, with two incompatible stage
 * vocabularies, and every column was a value in a TypeScript union -- so
 * changing the board meant changing types in three files.
 *
 * Now it is a normal pipeline over a normal table. `deals.stage` is plain text
 * with no constraint, so the list below is the whole definition: add a stage,
 * rename one, reorder them, change a colour, and the board follows. Nothing
 * else needs touching -- no migration, no type surgery.
 *
 * Two rules the board relies on:
 *   - `terminal: true` marks an outcome. Terminal stages are folded away behind
 *     a toggle rather than sitting on the board as columns you never drag into.
 *   - the first entry is where a new deal lands, and where every public intake
 *     form drops what it captures.
 */

export interface Stage {
  id: string;
  label: string;
  color: string;
  /** Won and Lost are results, not places work sits. */
  terminal?: boolean;
  /** Won counts as money in; Lost does not. Only meaningful when terminal. */
  winning?: boolean;
}

export const STAGES: Stage[] = [
  { id: "new",       label: "New",       color: "#5B9BD5" },
  { id: "contacted", label: "Contacted", color: "#E8A33D" },
  { id: "proposal",  label: "Proposal",  color: "#FF6B2B" },
  { id: "won",       label: "Won",       color: "#3FB86B", terminal: true, winning: true },
  { id: "lost",      label: "Lost",      color: "#8F827A", terminal: true },
];

export const OPEN_STAGES = STAGES.filter((s) => s.terminal !== true);
export const FIRST_STAGE = STAGES[0].id;

export function stageOf(id: string): Stage {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

/**
 * Where a deal came from. Free text in the database; this list is only what the
 * dropdown offers, so an unknown value from an old row still displays.
 */
export const SOURCES = [
  "referral",
  "instagram",
  "website",
  "contra",
  "cold_dm",
  "other",
] as const;

export const SOURCE_COLOR: Record<string, string> = {
  referral: "#3FB86B",
  instagram: "#D97AB0",
  website: "#5B9BD5",
  contra: "#A78BFA",
  cold_dm: "#FF6B2B",
  other: "#8F827A",
};

export interface Deal {
  id: string;
  created_at: string;
  /** What the deal is. Falls back to the company or contact when blank. */
  title: string | null;
  name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  referred_by: string | null;
  service_interest: string[] | null;
  budget_estimate: string | null;
  value: number | null;
  stage: string;
  next_step: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  notes: string | null;
  sort_order: number;
}

/** Every column the board reads. Kept here so the query and the type agree. */
export const DEAL_COLUMNS =
  "id,created_at,title,name,business_name,email,phone,city,state,source," +
  "referred_by,service_interest,budget_estimate,value,stage,next_step," +
  "follow_up_at,last_contacted_at,notes,sort_order";

/** The name to show on a card, whichever field the deal actually has. */
export function dealLabel(deal: Deal): string {
  return deal.title?.trim() || deal.business_name?.trim() || deal.name?.trim() || "Untitled deal";
}

export function money(value: number | null): string {
  if (value === null || value === 0) return "";
  return `$${Math.round(value).toLocaleString()}`;
}
