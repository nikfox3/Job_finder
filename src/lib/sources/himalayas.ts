import type { JobInput, Source } from "./types";
import { employmentLabel, normalizeSeniority, seniorityFromTitle, toIso } from "./util";

type HimalayasJob = {
  guid?: string;
  title: string;
  excerpt?: string;
  companyName: string;
  companySlug?: string;
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  seniority?: string[];
  locationRestrictions?: string[];
  timezoneRestrictions?: number[];
  categories?: string[];
  description?: string;
  pubDate?: number | string;
  applicationLink?: string;
};

function timezoneLabel(offsets: number[] | undefined) {
  if (!offsets?.length) return "Any";
  const fmt = (n: number) => `UTC${n === 0 ? "±0" : n > 0 ? `+${n}` : n}`;
  const min = Math.min(...offsets);
  const max = Math.max(...offsets);
  return min === max ? fmt(min) : `${fmt(min)} to ${fmt(max)}`;
}

export function parseHimalayas(data: unknown): JobInput[] {
  const jobs = (data as { jobs?: HimalayasJob[] })?.jobs ?? [];
  return jobs.map((j) => {
    const url = j.applicationLink ?? j.guid ?? `https://himalayas.app/companies/${j.companySlug}/jobs`;
    return {
      externalId: j.guid ?? `${j.companySlug}-${j.title}`,
      title: j.title,
      company: j.companyName,
      url: j.guid ?? url,
      applyUrl: j.applicationLink ?? null,
      location: j.locationRestrictions?.length ? j.locationRestrictions.join(", ") : "Worldwide",
      remote: true,
      salaryMin: j.minSalary ?? null,
      salaryMax: j.maxSalary ?? null,
      currency: j.currency ?? null,
      description: j.description ?? null,
      tags: (j.categories ?? []).map((c) => c.replace(/-/g, " ")).slice(0, 6),
      postedAt: toIso(j.pubDate),
      employmentType: employmentLabel(j.employmentType),
      seniority: normalizeSeniority(j.seniority?.[0]) ?? seniorityFromTitle(j.title),
      timezone: timezoneLabel(j.timezoneRestrictions),
      companyDescription: j.excerpt ?? null,
    };
  });
}

export const himalayas: Source = {
  id: "himalayas",
  name: "Himalayas",
  description: "Remote jobs with salary, timezone and company data.",
  mixedRoles: true,
  minIntervalMinutes: 60,
  defaultEnabled: true,
  fetch: async (ctx) => {
    // Search each keyword; the plain feed is mostly engineering roles.
    const queries = ctx.keywords.length ? ctx.keywords : ["designer"];
    try {
      const results = await Promise.all(
        queries.map(async (q) => parseHimalayas(await ctx.fetchJson(`https://himalayas.app/jobs/api/search?q=${encodeURIComponent(q)}`))),
      );
      return results.flat();
    } catch {
      // Fall back to paging the main feed (20 per page) and filtering locally.
      const pages = await Promise.all([0, 20, 40, 60, 80].map((o) => ctx.fetchJson(`https://himalayas.app/jobs/api?limit=20&offset=${o}`)));
      return pages.flatMap(parseHimalayas);
    }
  },
};
