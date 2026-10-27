import type { JobInput, Source } from "./types";
import { employmentLabel, isRemoteText, parseSalaryText, seniorityFromTitle, toIso } from "./util";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

export function parseRemotive(data: unknown): JobInput[] {
  const jobs = (data as { jobs?: RemotiveJob[] })?.jobs ?? [];
  return jobs.map((j) => {
    const salary = parseSalaryText(j.salary);
    return {
      externalId: String(j.id),
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.candidate_required_location || null,
      remote: true,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      description: j.description ?? null,
      tags: j.tags ?? [],
      postedAt: toIso(j.publication_date),
      employmentType: employmentLabel(j.job_type),
      seniority: seniorityFromTitle(j.title),
      timezone: isRemoteText(j.candidate_required_location) ? "Any" : null,
    };
  });
}

export const remotive: Source = {
  id: "remotive",
  name: "Remotive",
  description: "Curated remote jobs with a strong design category.",
  mixedRoles: false,
  // Remotive asks clients to fetch at most a few times a day.
  minIntervalMinutes: 360,
  defaultEnabled: true,
  fetch: async (ctx) => parseRemotive(await ctx.fetchJson("https://remotive.com/api/remote-jobs?category=design")),
};
