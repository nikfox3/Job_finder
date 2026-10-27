import type { JobInput } from "./sources/types";
import { decodeEntities, employmentLabel, isRemoteText, seniorityFromTitle, toIso } from "./sources/util";

type Ld = Record<string, unknown>;

function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function findJobPosting(node: unknown): Ld | null {
  for (const item of asArray(node as Ld | Ld[])) {
    if (!item || typeof item !== "object") continue;
    const type = asArray(item["@type"] as string | string[]);
    if (type.includes("JobPosting")) return item;
    const nested = findJobPosting(item["@graph"]);
    if (nested) return nested;
  }
  return null;
}

function meta(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i");
  const m = html.match(re) ?? html.match(alt);
  return m ? decodeEntities(m[1]) : null;
}

function locationText(posting: Ld) {
  const places = asArray(posting.jobLocation as Ld | Ld[]).map((l) => {
    const a = (l?.address ?? {}) as Ld;
    return [a.addressLocality, a.addressRegion, a.addressCountry].filter((x) => typeof x === "string").join(", ");
  });
  const allowed = asArray(posting.applicantLocationRequirements as Ld | Ld[]).map((r) => r?.name).filter(Boolean);
  return [...places, ...allowed].filter(Boolean).join(" · ") || null;
}

/**
 * Reads a job page (LinkedIn, Indeed, company sites...) using the schema.org
 * JobPosting data most job pages include for Google, with page meta as a fallback.
 */
export function parseJobPage(html: string, url: string): Partial<JobInput> {
  let posting: Ld | null = null;
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      posting = findJobPosting(JSON.parse(m[1].trim()));
    } catch {
      continue;
    }
    if (posting) break;
  }

  if (!posting) {
    const title = meta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
    return { title: title ?? undefined, description: meta(html, "og:description"), url };
  }

  const org = (posting.hiringOrganization ?? {}) as Ld;
  const salary = (posting.baseSalary ?? {}) as Ld;
  const value = (salary.value ?? {}) as Ld;
  const location = locationText(posting);
  const title = decodeEntities(String(posting.title ?? ""));
  return {
    title,
    company: typeof org.name === "string" ? decodeEntities(org.name) : undefined,
    companyWebsite: typeof org.sameAs === "string" ? org.sameAs : null,
    url,
    location,
    remote: posting.jobLocationType === "TELECOMMUTE" || isRemoteText(location) || isRemoteText(title),
    salaryMin: Number(value.minValue ?? value.value) || null,
    salaryMax: Number(value.maxValue ?? value.value) || null,
    currency: typeof salary.currency === "string" ? salary.currency : null,
    description: typeof posting.description === "string" ? decodeEntities(posting.description) : null,
    postedAt: toIso(posting.datePosted as string),
    employmentType: employmentLabel(asArray(posting.employmentType as string | string[])[0]),
    seniority: seniorityFromTitle(title),
  };
}

export function sourceFromUrl(url: string) {
  const host = new URL(url).hostname;
  if (host.endsWith("linkedin.com")) return "linkedin";
  if (host.endsWith("indeed.com")) return "indeed";
  return "import";
}
