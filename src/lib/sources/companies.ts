import type { FetchContext, JobInput } from "./types";
import { employmentLabel, isRemoteText, seniorityFromTitle, toIso, decodeEntities } from "./util";

export type Ats = "greenhouse" | "lever" | "ashby";
export type WatchedCompany = { ats: Ats; slug: string; name: string };

export const ATS_NAMES: Record<Ats, string> = { greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby" };

/** Turns a careers link like boards.greenhouse.io/figma or jobs.lever.co/acme into a watchable company. */
export function parseCareersUrl(input: string): { ats: Ats; slug: string } | null {
  let url: URL;
  try {
    url = new URL(input.trim().startsWith("http") ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const first = url.pathname.split("/").filter(Boolean)[0];
  if (/(^|\.)greenhouse\.io$/.test(host)) {
    const slug = url.searchParams.get("for") ?? (first === "embed" ? null : first);
    return slug ? { ats: "greenhouse", slug } : null;
  }
  if (/(^|\.)lever\.co$/.test(host) && first) return { ats: "lever", slug: first };
  if (/(^|\.)ashbyhq\.com$/.test(host) && first) return { ats: "ashby", slug: first };
  return null;
}

// --- Greenhouse -------------------------------------------------------------

type GreenhouseJob = {
  id: number;
  title: string;
  updated_at?: string;
  first_published?: string;
  location?: { name?: string };
  absolute_url: string;
  content?: string;
  departments?: { name: string }[];
};

export function parseGreenhouse(data: unknown, company: WatchedCompany): JobInput[] {
  const jobs = (data as { jobs?: GreenhouseJob[] })?.jobs ?? [];
  return jobs.map((j) => ({
    externalId: `${company.slug}-${j.id}`,
    title: j.title,
    company: company.name,
    url: j.absolute_url,
    applyUrl: j.absolute_url,
    location: j.location?.name ?? null,
    remote: isRemoteText(j.location?.name),
    // Greenhouse returns the description HTML-escaped.
    description: j.content ? decodeEntities(j.content) : null,
    tags: (j.departments ?? []).map((d) => d.name),
    postedAt: toIso(j.first_published ?? j.updated_at),
    seniority: seniorityFromTitle(j.title),
  }));
}

// --- Lever ------------------------------------------------------------------

type LeverJob = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  workplaceType?: string;
  categories?: { location?: string; team?: string; commitment?: string };
  description?: string;
  lists?: { text: string; content: string }[];
  additional?: string;
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
};

export function parseLever(data: unknown, company: WatchedCompany): JobInput[] {
  const jobs = (Array.isArray(data) ? data : []) as LeverJob[];
  return jobs.map((j) => {
    const lists = (j.lists ?? []).map((l) => `<h3>${l.text}</h3><ul>${l.content}</ul>`).join("");
    return {
      externalId: `${company.slug}-${j.id}`,
      title: j.text,
      company: company.name,
      url: j.hostedUrl,
      applyUrl: j.applyUrl ?? j.hostedUrl,
      location: j.categories?.location ?? null,
      remote: j.workplaceType === "remote" || isRemoteText(j.categories?.location),
      salaryMin: j.salaryRange?.min ?? null,
      salaryMax: j.salaryRange?.max ?? null,
      currency: j.salaryRange?.currency ?? null,
      description: [j.description, lists, j.additional].filter(Boolean).join("") || null,
      tags: j.categories?.team ? [j.categories.team] : [],
      postedAt: toIso(j.createdAt),
      employmentType: employmentLabel(j.categories?.commitment),
      seniority: seniorityFromTitle(j.text),
    };
  });
}

// --- Ashby ------------------------------------------------------------------

type AshbyJob = {
  id: string;
  title: string;
  location?: string;
  department?: string;
  team?: string;
  isRemote?: boolean;
  workplaceType?: string;
  descriptionHtml?: string;
  publishedAt?: string;
  employmentType?: string;
  jobUrl: string;
  applyUrl?: string;
  compensation?: {
    summaryComponents?: { compensationType?: string; interval?: string; minValue?: number; maxValue?: number; currencyCode?: string }[];
  };
};

export function parseAshby(data: unknown, company: WatchedCompany): JobInput[] {
  const jobs = (data as { jobs?: AshbyJob[] })?.jobs ?? [];
  return jobs.map((j) => {
    const salary = j.compensation?.summaryComponents?.find((c) => c.compensationType === "Salary");
    return {
      externalId: `${company.slug}-${j.id}`,
      title: j.title,
      company: company.name,
      url: j.jobUrl,
      applyUrl: j.applyUrl ?? j.jobUrl,
      location: j.location ?? null,
      remote: Boolean(j.isRemote) || j.workplaceType === "Remote" || isRemoteText(j.location),
      salaryMin: salary?.minValue ?? null,
      salaryMax: salary?.maxValue ?? null,
      currency: salary?.currencyCode ?? null,
      description: j.descriptionHtml ?? null,
      tags: [j.department, j.team].filter((t): t is string => Boolean(t)),
      postedAt: toIso(j.publishedAt),
      employmentType: employmentLabel(j.employmentType?.replace(/([a-z])([A-Z])/g, "$1_$2")),
      seniority: seniorityFromTitle(j.title),
    };
  });
}

export async function fetchCompany(company: WatchedCompany, ctx: FetchContext): Promise<JobInput[]> {
  const slug = encodeURIComponent(company.slug);
  switch (company.ats) {
    case "greenhouse":
      return parseGreenhouse(await ctx.fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`), company);
    case "lever":
      return parseLever(await ctx.fetchJson(`https://api.lever.co/v0/postings/${slug}?mode=json`), company);
    case "ashby":
      return parseAshby(await ctx.fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`), company);
  }
}
