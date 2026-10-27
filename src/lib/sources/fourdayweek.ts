import type { JobInput, Source } from "./types";
import { seniorityFromTitle, toIso } from "./util";

type FourDayJob = {
  slug?: string;
  title?: string;
  company_name?: string;
  company?: { name?: string };
  description?: string;
  posted?: number;
  is_expired?: boolean;
  work_arrangement?: string;
  locations?: { city?: string; country?: string; work_arrangement?: string }[];
};

export function parseFourDayWeek(data: unknown): JobInput[] {
  const jobs = (data as { jobs?: FourDayJob[] })?.jobs ?? [];
  return jobs
    .filter((j) => j.title && j.slug && !j.is_expired && /^[\w-]+$/.test(j.slug))
    .map((j) => {
      const first = j.locations?.[0] ?? {};
      const remote = j.work_arrangement === "remote" || first.work_arrangement === "remote";
      const place = [first.city, first.country].filter(Boolean).join(", ");
      return {
        externalId: j.slug!,
        title: j.title!,
        company: j.company_name ?? j.company?.name ?? "Unknown company",
        // The feed has no URL field; job pages live at /job/<slug>.
        url: `https://4dayweek.io/job/${j.slug}`,
        location: [place, remote ? "Remote" : ""].filter(Boolean).join(", ") || null,
        remote,
        description: typeof j.description === "string" ? j.description : null,
        postedAt: toIso(j.posted),
        seniority: seniorityFromTitle(j.title!),
      };
    });
}

const PAGES = 3;

export const fourdayweek: Source = {
  id: "fourdayweek",
  name: "4 Day Week",
  description: "Jobs with a 4-day or 32-hour week, filtered to design roles.",
  mixedRoles: true,
  minIntervalMinutes: 120,
  defaultEnabled: true,
  fetch: async (ctx) => {
    const out: JobInput[] = [];
    for (let page = 1; page <= PAGES; page++) {
      const data = await ctx.fetchJson(`https://4dayweek.io/api/jobs?page=${page}`);
      const jobs = parseFourDayWeek(data);
      out.push(...jobs);
      if ((data as { has_more?: boolean })?.has_more === false || !jobs.length) break;
    }
    return out;
  },
};
