import type { Job } from "./jobs";

export type Freshness = { kind: "closed" | "stale" | "fresh"; label: string | null; detail: string | null };

const STALE_DAYS = 30;

/**
 * Closed postings came down from their careers page or say they're filled.
 * Stale ones are over a month old: often already filled, or ghost jobs that
 * were never really open.
 */
export function freshness(job: Pick<Job, "closed_at" | "posted_at">, now = Date.now()): Freshness {
  if (job.closed_at) {
    return { kind: "closed", label: "Closed", detail: "This posting was taken down or stopped accepting applications." };
  }
  const posted = job.posted_at ? new Date(job.posted_at.replace(" ", "T") + (job.posted_at.includes("Z") ? "" : "Z")).getTime() : NaN;
  if (Number.isFinite(posted) && now - posted > STALE_DAYS * 86_400_000) {
    return {
      kind: "stale",
      label: "Over a month old",
      detail: "Older postings are often already filled, or are ghost jobs that were never really open. Worth checking it's still live before you spend time on it.",
    };
  }
  return { kind: "fresh", label: null, detail: null };
}

/** Text a job page shows once the role is no longer open. */
export const CLOSED_PAGE =
  /no longer (accepting applications|available|open|active)|(position|role|job) has (been filled|closed|expired)|this (job|position|posting|role) (is closed|has closed|is no longer)|job (posting )?(not found|has expired)|applications (are )?(now )?closed/i;
