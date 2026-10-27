import type { JobInput, Source } from "./types";
import { employmentLabel, seniorityFromTitle, toIso } from "./util";

type ArbeitnowJob = {
  slug: string;
  company_name: string;
  title: string;
  description?: string;
  remote?: boolean;
  url: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
};

export function parseArbeitnow(data: unknown): JobInput[] {
  const jobs = (data as { data?: ArbeitnowJob[] })?.data ?? [];
  return jobs.map((j) => ({
    externalId: j.slug,
    title: j.title,
    company: j.company_name,
    url: j.url,
    location: j.location || null,
    remote: Boolean(j.remote),
    description: j.description ?? null,
    tags: j.tags ?? [],
    postedAt: toIso(j.created_at),
    employmentType: employmentLabel(j.job_types?.[0]),
    seniority: seniorityFromTitle(j.title),
  }));
}

export const arbeitnow: Source = {
  id: "arbeitnow",
  name: "Arbeitnow",
  description: "Mostly European roles, many with visa sponsorship.",
  mixedRoles: true,
  minIntervalMinutes: 60,
  defaultEnabled: false,
  fetch: async (ctx) => {
    const pages = await Promise.all([1, 2, 3].map((p) => ctx.fetchJson(`https://www.arbeitnow.com/api/job-board-api?page=${p}`)));
    return pages.flatMap(parseArbeitnow);
  },
};
