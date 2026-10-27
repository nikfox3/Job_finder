import type { JobInput, Source } from "./types";
import { seniorityFromTitle, toIso } from "./util";

type NomadsJob = {
  url: string;
  title: string;
  description?: string;
  company_name: string;
  category_name?: string;
  tags?: string;
  location?: string;
  pub_date?: string;
};

export function parseWorkingNomads(data: unknown): JobInput[] {
  const jobs = (Array.isArray(data) ? data : []) as NomadsJob[];
  return jobs
    .filter((j) => !j.category_name || /design/i.test(j.category_name))
    .map((j) => ({
      externalId: j.url,
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.location || null,
      remote: true,
      description: j.description ?? null,
      tags: (j.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6),
      postedAt: toIso(j.pub_date),
      seniority: seniorityFromTitle(j.title),
    }));
}

export const workingnomads: Source = {
  id: "workingnomads",
  name: "Working Nomads",
  description: "Hand-picked remote jobs, filtered to the design category.",
  mixedRoles: false,
  minIntervalMinutes: 60,
  defaultEnabled: true,
  fetch: async (ctx) => parseWorkingNomads(await ctx.fetchJson("https://www.workingnomads.com/api/exposed_jobs/")),
};
