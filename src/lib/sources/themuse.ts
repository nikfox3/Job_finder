import type { JobInput, Source } from "./types";
import { isRemoteText, normalizeSeniority, seniorityFromTitle, toIso } from "./util";

type MuseJob = {
  id: number;
  name: string;
  contents?: string;
  publication_date?: string;
  locations?: { name: string }[];
  levels?: { name: string; short_name?: string }[];
  categories?: { name: string }[];
  company?: { name?: string };
  refs?: { landing_page?: string };
};

export function parseTheMuse(data: unknown): JobInput[] {
  const jobs = (data as { results?: MuseJob[] })?.results ?? [];
  return jobs
    .filter((j) => j.name && j.refs?.landing_page)
    .map((j) => {
      const location = (j.locations ?? []).map((l) => l.name).join(" · ") || null;
      return {
        externalId: String(j.id),
        title: j.name,
        company: j.company?.name ?? "Unknown company",
        url: j.refs!.landing_page!,
        location,
        remote: isRemoteText(location) || /flexible/i.test(location ?? ""),
        description: j.contents ?? null,
        tags: (j.categories ?? []).map((c) => c.name),
        postedAt: toIso(j.publication_date),
        seniority: normalizeSeniority(j.levels?.[0]?.name) ?? seniorityFromTitle(j.name),
      };
    });
}

// The Muse pages its results; a few pages covers recent design roles.
const PAGES = 3;

export const themuse: Source = {
  id: "themuse",
  name: "The Muse",
  description: "Design & UX roles that are remote or flexible, with company profiles.",
  mixedRoles: false,
  minIntervalMinutes: 120,
  defaultEnabled: true,
  fetch: async (ctx) => {
    const out: JobInput[] = [];
    for (let page = 0; page < PAGES; page++) {
      const data = await ctx.fetchJson(
        `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent("Design and UX")}&location=${encodeURIComponent("Flexible / Remote")}&page=${page}`,
      );
      const jobs = parseTheMuse(data);
      out.push(...jobs);
      const pageCount = (data as { page_count?: number })?.page_count ?? 0;
      if (!jobs.length || page + 1 >= pageCount) break;
    }
    return out;
  },
};
