import type { JobInput, Source } from "./types";
import { employmentLabel, normalizeSeniority, seniorityFromTitle, toIso } from "./util";

type JobicyJob = {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobLevel?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: number | string;
  annualSalaryMax?: number | string;
  salaryCurrency?: string;
};

export function parseJobicy(data: unknown): JobInput[] {
  const jobs = (data as { jobs?: JobicyJob[] })?.jobs ?? [];
  return jobs.map((j) => ({
    externalId: String(j.id),
    title: decodeHtml(j.jobTitle),
    company: decodeHtml(j.companyName),
    url: j.url,
    location: j.jobGeo ?? null,
    remote: true,
    salaryMin: j.annualSalaryMin ? Number(j.annualSalaryMin) : null,
    salaryMax: j.annualSalaryMax ? Number(j.annualSalaryMax) : null,
    currency: j.salaryCurrency ?? null,
    description: j.jobDescription ?? null,
    tags: (j.jobIndustry ?? []).map(decodeHtml),
    postedAt: toIso(j.pubDate?.replace(" ", "T") + (j.pubDate?.includes("Z") ? "" : "Z")),
    employmentType: employmentLabel(j.jobType?.[0]),
    seniority: j.jobLevel && j.jobLevel !== "Any" ? normalizeSeniority(j.jobLevel) : seniorityFromTitle(j.jobTitle),
  }));
}

function decodeHtml(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&#8211;/g, "–").replace(/&#038;/g, "&");
}

export const jobicy: Source = {
  id: "jobicy",
  name: "Jobicy",
  description: "Remote jobs with a dedicated design & multimedia category.",
  mixedRoles: false,
  minIntervalMinutes: 60,
  defaultEnabled: true,
  fetch: async (ctx) => parseJobicy(await ctx.fetchJson("https://jobicy.com/api/v2/remote-jobs?count=50&industry=design-multimedia")),
};
