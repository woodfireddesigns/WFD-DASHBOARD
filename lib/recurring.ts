import type { Cadence, TaskTemplate } from "./supabase";

/**
 * Recurring tasks.
 *
 * The Tasks page reads `tasks` filtered to `date = today`, which means a row
 * created yesterday is simply gone this morning. The old tier called "Daily
 * Recurring" never recurred — it was a label on a one-off. Templates fix that:
 * they are the standing commitment, and each morning the page materialises one
 * task row per template that is due.
 *
 * Materialising on read rather than on a schedule keeps this honest on a
 * single-operator app with no cron: the tasks exist the moment you look at them,
 * and never before.
 */

/** ISO weekday, 1 = Monday .. 7 = Sunday. `Date.getDay()` puts Sunday at 0. */
export function isoWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

/** Local-time YYYY-MM-DD. `toISOString()` would shift the date west of UTC. */
export function localDay(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDueOn(cadence: Cadence, weekdays: number[], date: Date): boolean {
  const wd = isoWeekday(date);
  if (cadence === "daily") return true;
  if (cadence === "weekdays") return wd >= 1 && wd <= 5;
  return weekdays.includes(wd);
}

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function cadenceLabel(cadence: Cadence, weekdays: number[]): string {
  if (cadence === "daily") return "Every day";
  if (cadence === "weekdays") return "Mon–Fri";
  if (weekdays.length === 0) return "No days set";
  return [...weekdays].sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(" & ");
}

/**
 * Which templates owe a task for `date` and do not already have one.
 *
 * Takes the template ids already present rather than the task rows, so the
 * caller can pass whatever shape it has and this stays pure.
 */
export function templatesToMaterialise(
  templates: TaskTemplate[],
  existingTemplateIds: Set<string>,
  date: Date = new Date()
): TaskTemplate[] {
  return templates.filter(
    (t) => t.active && isDueOn(t.cadence, t.weekdays, date) && !existingTemplateIds.has(t.id)
  );
}
