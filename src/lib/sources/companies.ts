import type { FetchContext, JobInput } from "./types";
import { employmentLabel, isRemoteText, normalizeSeniority, seniorityFromTitle, toIso, decodeEntities } from "./util";

export type Ats = "greenhouse" | "lever" | "ashby" | "workable" | "smartrecruiters" | "recruitee" | "breezy";
export type WatchedCompany = { ats: Ats; slug: string; name: string };

export const ATS_NAMES: Record<Ats, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  workable: "Workable",
  smartrecruiters: "SmartRecruiters",
  recruitee: "Recruitee",
  breezy: "Breezy",
};

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
  if (host === "apply.workable.com" && first && first !== "api") return { ats: "workable", slug: first };
  if (/^(careers|jobs)\.smartrecruiters\.com$/.test(host) && first) return { ats: "smartrecruiters", slug: first };
  // These two put the company in the subdomain: acme.recruitee.com, acme.breezy.hr.
  const sub = host.split(".")[0];
  if (/^[\w-]+\.recruitee\.com$/.test(host) && sub !== "www") return { ats: "recruitee", slug: sub };
  if (/^[\w-]+\.breezy\.hr$/.test(host) && sub !== "www") return { ats: "breezy", slug: sub };
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

// --- Workable ---------------------------------------------------------------

type WorkableJob = {
  title?: string;
  shortcode?: string;
  shortlink?: string;
  url?: string;
  city?: string;
  country?: string;
  telecommuting?: boolean;
  description?: string;
  published_on?: string;
  created_at?: string;
  employment_type?: string;
  department?: string;
};

export function parseWorkable(data: unknown, company: WatchedCompany): JobInput[] {
  const jobs = (data as { jobs?: WorkableJob[] })?.jobs ?? [];
  // Multi-country postings come back once per location; fold them into one job.
  const byUrl = new Map<string, { job: JobInput; places: Set<string> }>();
  for (const j of jobs) {
    const url = j.shortlink ?? j.url;
    if (!j.title || !url) continue;
    const place = [j.city, j.country].filter(Boolean).join(", ");
    const seen = byUrl.get(url);
    if (seen) {
      if (place) seen.places.add(place);
      continue;
    }
    byUrl.set(url, {
      places: new Set(place ? [place] : []),
      job: {
        externalId: `${company.slug}-${j.shortcode ?? url}`,
        title: j.title,
        company: company.name,
        url,
        applyUrl: url,
        remote: Boolean(j.telecommuting),
        description: j.description ?? null,
        tags: j.department ? [j.department] : [],
        postedAt: toIso(j.published_on ?? j.created_at),
        employmentType: employmentLabel(j.employment_type),
        seniority: seniorityFromTitle(j.title),
      },
    });
  }
  return [...byUrl.values()].map(({ job, places }) => {
    const location = [...places].join(" · ") || null;
    return { ...job, location: job.remote && !isRemoteText(location) ? [location, "Remote"].filter(Boolean).join(", ") : location };
  });
}

// --- SmartRecruiters --------------------------------------------------------

type SmartRecruitersJob = {
  id: string;
  name: string;
  releasedDate?: string;
  location?: { fullLocation?: string; city?: string; region?: string; country?: string; remote?: boolean };
  typeOfEmployment?: { label?: string };
  experienceLevel?: { label?: string };
  department?: { label?: string };
};

export function parseSmartRecruiters(data: unknown, company: WatchedCompany): JobInput[] {
  const jobs = (data as { content?: SmartRecruitersJob[] })?.content ?? [];
  return jobs
    .filter((j) => j.id && j.name)
    .map((j) => {
      const loc = j.location ?? {};
      const place = loc.fullLocation || [loc.city, loc.region, loc.country].filter(Boolean).join(", ");
      const location = [place, loc.remote ? "Remote" : ""].filter(Boolean).join(", ") || null;
      // The public job page; the trailing title slug is cosmetic.
      const titleSlug = j.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const url = `https://jobs.smartrecruiters.com/${encodeURIComponent(company.slug)}/${encodeURIComponent(j.id)}-${titleSlug}`;
      return {
        externalId: `${company.slug}-${j.id}`,
        title: j.name,
        company: company.name,
        url,
        applyUrl: url,
        location,
        remote: Boolean(loc.remote) || isRemoteText(place),
        tags: j.department?.label ? [j.department.label] : [],
        postedAt: toIso(j.releasedDate),
        employmentType: employmentLabel(j.typeOfEmployment?.label),
        seniority: normalizeSeniority(j.experienceLevel?.label) ?? seniorityFromTitle(j.name),
      };
    });
}

// --- Recruitee --------------------------------------------------------------

type RecruiteeOffer = {
  id: number;
  title: string;
  careers_url?: string;
  url?: string;
  city?: string;
  country?: string;
  location?: string;
  remote?: boolean;
  description?: string;
  requirements?: string;
  published_at?: string;
  department?: string;
  employment_type_code?: string;
  salary?: { min?: string | number; max?: string | number; currency?: string };
};

export function parseRecruitee(data: unknown, company: WatchedCompany): JobInput[] {
  const offers = (data as { offers?: RecruiteeOffer[] })?.offers ?? [];
  return offers
    .filter((o) => o.title && (o.careers_url || o.url))
    .map((o) => {
      const url = (o.careers_url ?? o.url)!;
      const place = o.location || [o.city, o.country].filter(Boolean).join(", ");
      const num = (v: string | number | undefined) => (v === undefined || v === "" ? null : Number(v) || null);
      return {
        externalId: `${company.slug}-${o.id}`,
        title: o.title,
        company: company.name,
        url,
        applyUrl: url,
        location: [place, o.remote && !isRemoteText(place) ? "Remote" : ""].filter(Boolean).join(", ") || null,
        remote: Boolean(o.remote) || isRemoteText(place),
        salaryMin: num(o.salary?.min),
        salaryMax: num(o.salary?.max),
        currency: o.salary?.currency ?? null,
        description: [o.description, o.requirements].filter(Boolean).join("") || null,
        tags: o.department ? [o.department] : [],
        postedAt: toIso(o.published_at),
        employmentType: employmentLabel(o.employment_type_code),
        seniority: seniorityFromTitle(o.title),
      };
    });
}

// --- Breezy -----------------------------------------------------------------

type BreezyJob = {
  id?: string;
  name?: string;
  url?: string;
  published_date?: string;
  type?: { name?: string };
  department?: string;
  location?: { name?: string; city?: string; state?: string; country?: { name?: string }; is_remote?: boolean };
};

export function parseBreezy(data: unknown, company: WatchedCompany): JobInput[] {
  const jobs = (Array.isArray(data) ? data : []) as BreezyJob[];
  return jobs
    .filter((j) => j.name && j.url)
    .map((j) => {
      const loc = j.location ?? {};
      const country = loc.country?.name;
      let place = loc.name?.trim() || [loc.city, loc.state, country].filter(Boolean).join(", ");
      // location.name is often just "Seattle, WA"; add the country so location filters can read it.
      if (country && place && !place.toLowerCase().includes(country.toLowerCase())) place = `${place}, ${country}`;
      const remote = Boolean(loc.is_remote) || isRemoteText(place);
      return {
        externalId: `${company.slug}-${j.id ?? j.url}`,
        title: j.name!,
        company: company.name,
        url: j.url!,
        applyUrl: j.url!,
        location: [place, loc.is_remote && !isRemoteText(place) ? "Remote" : ""].filter(Boolean).join(", ") || null,
        remote,
        tags: j.department ? [j.department] : [],
        postedAt: toIso(j.published_date),
        employmentType: employmentLabel(j.type?.name),
        seniority: seniorityFromTitle(j.name!),
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
    case "workable":
      return parseWorkable(await ctx.fetchJson(`https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`), company);
    case "smartrecruiters":
      return parseSmartRecruiters(await ctx.fetchJson(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`), company);
    case "recruitee":
      return parseRecruitee(await ctx.fetchJson(`https://${slug}.recruitee.com/api/offers/`), company);
    case "breezy":
      return parseBreezy(await ctx.fetchJson(`https://${slug}.breezy.hr/json`), company);
  }
}
