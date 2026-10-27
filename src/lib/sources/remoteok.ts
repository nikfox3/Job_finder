import type { JobInput, Source } from "./types";
import { seniorityFromTitle, toIso } from "./util";

type RemoteOkJob = {
  id?: string | number;
  slug?: string;
  epoch?: number;
  date?: string;
  company?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  apply_url?: string;
  url?: string;
};

export function parseRemoteOk(data: unknown): JobInput[] {
  // The first element is a legal notice, not a job.
  const rows = (Array.isArray(data) ? data : []) as RemoteOkJob[];
  return rows
    .filter((j) => j.id && j.position && j.company)
    .map((j) => ({
      externalId: String(j.id),
      title: j.position!,
      company: j.company!,
      url: j.url ?? `https://remoteok.com/remote-jobs/${j.slug ?? j.id}`,
      applyUrl: j.apply_url || null,
      location: j.location || null,
      remote: true,
      salaryMin: j.salary_min || null,
      salaryMax: j.salary_max || null,
      currency: j.salary_min || j.salary_max ? "USD" : null,
      description: j.description ?? null,
      tags: j.tags ?? [],
      postedAt: toIso(j.date ?? j.epoch),
      seniority: seniorityFromTitle(j.position!),
    }));
}

export const remoteok: Source = {
  id: "remoteok",
  name: "Remote OK",
  description: "Large remote-only board, filtered to design roles.",
  mixedRoles: true,
  minIntervalMinutes: 60,
  defaultEnabled: true,
  fetch: async (ctx) => parseRemoteOk(await ctx.fetchJson("https://remoteok.com/api?tag=design")),
};
