import type { JobInput, Source } from "./types";
import { seniorityFromTitle, toIso } from "./util";

type WttjHit = {
  name?: string;
  slug?: string;
  organization?: { name?: string; slug?: string };
  offices?: { city?: string; country?: string; country_code?: string }[];
  remote?: string;
  published_at_timestamp?: number;
  salary_yearly_minimum?: number;
  salary_maximum?: number;
  salary_currency?: string;
};

const SITE = "https://www.welcometothejungle.com";
const INDEX = "wttj_jobs_production_en";
const SAFE = /^[a-z0-9_-]+$/i;

/** The site's public Algolia app id and search key, which rotate, from /api/env. */
export function parseWttjEnv(text: string) {
  const env = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Record<string, string>;
  const appId = env.PUBLIC_ALGOLIA_APPLICATION_ID?.trim() ?? "";
  const apiKey = env.PUBLIC_ALGOLIA_API_KEY_CLIENT?.trim() ?? "";
  if (!/^[A-Z0-9]{6,16}$/i.test(appId) || apiKey.length < 16) throw new Error("sent something unexpected (its format may have changed)");
  return { appId, apiKey };
}

export function parseWttjHits(data: unknown): JobInput[] {
  const hits = (data as { hits?: WttjHit[] })?.hits ?? [];
  return hits
    .filter((h) => h.name && h.slug && h.organization?.slug && SAFE.test(h.slug) && SAFE.test(h.organization.slug))
    .map((h) => {
      const office = h.offices?.[0];
      const remote = h.remote === "fulltime";
      return {
        externalId: `${h.organization!.slug}-${h.slug}`,
        title: h.name!,
        company: h.organization!.name ?? "Unknown company",
        url: `${SITE}/en/companies/${h.organization!.slug}/jobs/${h.slug}`,
        location: [office?.city, office?.country, remote ? "Remote" : ""].filter(Boolean).join(", ") || null,
        remote,
        salaryMin: h.salary_yearly_minimum ?? null,
        salaryMax: h.salary_maximum ?? null,
        currency: h.salary_currency ?? null,
        postedAt: toIso(h.published_at_timestamp),
        seniority: seniorityFromTitle(h.name!),
      };
    });
}

export const wttj: Source = {
  id: "wttj",
  name: "Welcome to the Jungle",
  description: "Startup roles (formerly Otta) with salary and company info. Searches your keywords, fully remote only.",
  mixedRoles: true,
  minIntervalMinutes: 120,
  defaultEnabled: true,
  fetch: async (ctx) => {
    const { appId, apiKey } = parseWttjEnv(await ctx.fetchText(`${SITE}/api/env`));
    const out = new Map<string, JobInput>();
    for (const query of ctx.keywords.slice(0, 5)) {
      const params = new URLSearchParams({ query, hitsPerPage: "100", filters: "remote:fulltime" });
      const data = await ctx.fetchJson(`https://${appId}-dsn.algolia.net/1/indexes/${INDEX}/query`, {
        method: "POST",
        // The search key only works when the request says it came from the site.
        headers: { "x-algolia-application-id": appId, "x-algolia-api-key": apiKey, Referer: `${SITE}/`, "Content-Type": "application/json" },
        body: JSON.stringify({ params: params.toString() }),
      });
      for (const job of parseWttjHits(data)) out.set(job.externalId, job);
    }
    return [...out.values()];
  },
};
