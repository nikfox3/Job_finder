import { XMLParser } from "fast-xml-parser";
import type { JobInput, Source } from "./types";
import { seniorityFromTitle, toIso } from "./util";

type Item = {
  title?: string;
  link?: string;
  guid?: string | { "#text": string };
  pubDate?: string;
  description?: string;
  "content:encoded"?: string;
  "job_listing:company"?: string;
  "job_listing:location"?: string;
};

function items(xml: string): Item[] {
  const parsed = new XMLParser({ ignoreAttributes: true }).parse(xml);
  const raw = parsed?.rss?.channel?.item ?? [];
  return (Array.isArray(raw) ? raw : [raw]).filter((i: Item) => i?.title && i.link);
}

/** NoDesk titles read "Role at Company". */
export function parseNoDesk(xml: string): JobInput[] {
  return items(xml).map((i) => {
    const full = String(i.title).trim();
    const at = full.toLowerCase().lastIndexOf(" at ");
    const title = at > 0 ? full.slice(0, at).trim() : full;
    return {
      externalId: i.link!,
      title,
      company: at > 0 ? full.slice(at + 4).trim() : "Unknown company",
      url: i.link!,
      location: "Remote",
      remote: true,
      description: i["content:encoded"] ?? i.description ?? null,
      postedAt: toIso(i.pubDate),
      seniority: seniorityFromTitle(title),
    };
  });
}

/** WordPress Job Manager feeds carry company and location in their own tags. */
export function parseJobspresso(xml: string): JobInput[] {
  return items(xml).map((i) => {
    const title = String(i.title).trim();
    const location = i["job_listing:location"] ? String(i["job_listing:location"]) : null;
    const guid = typeof i.guid === "object" ? i.guid["#text"] : i.guid;
    return {
      externalId: guid ?? i.link!,
      title,
      company: i["job_listing:company"] ? String(i["job_listing:company"]) : "Unknown company",
      url: i.link!,
      location: location ?? "Remote",
      // Jobspresso only lists remote roles.
      remote: true,
      description: i["content:encoded"] ?? i.description ?? null,
      postedAt: toIso(i.pubDate),
      seniority: seniorityFromTitle(title),
    };
  });
}

export const nodesk: Source = {
  id: "nodesk",
  name: "NoDesk",
  description: "Curated remote jobs, filtered to design roles.",
  mixedRoles: true,
  minIntervalMinutes: 120,
  defaultEnabled: true,
  fetch: async (ctx) => parseNoDesk(await ctx.fetchText("https://nodesk.co/remote-jobs/index.xml")),
};

export const jobspresso: Source = {
  id: "jobspresso",
  name: "Jobspresso",
  description: "Hand-screened remote jobs, filtered to design roles.",
  mixedRoles: true,
  minIntervalMinutes: 120,
  defaultEnabled: true,
  fetch: async (ctx) => parseJobspresso(await ctx.fetchText("https://jobspresso.co/?feed=job_feed")),
};
