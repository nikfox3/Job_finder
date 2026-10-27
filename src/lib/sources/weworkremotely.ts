import { XMLParser } from "fast-xml-parser";
import type { JobInput, Source } from "./types";
import { employmentLabel, seniorityFromTitle, toIso } from "./util";

type Item = {
  title?: string;
  region?: string;
  type?: string;
  description?: string;
  pubDate?: string;
  link?: string;
  guid?: string | { "#text": string };
};

export function parseWeWorkRemotely(xml: string): JobInput[] {
  const parsed = new XMLParser({ ignoreAttributes: true }).parse(xml);
  const raw = parsed?.rss?.channel?.item ?? [];
  const items: Item[] = Array.isArray(raw) ? raw : [raw];
  return items
    .filter((i) => i.title && i.link)
    .map((i) => {
      // Titles look like "Company Name: Job Title". The XML parser already decodes entities.
      const full = String(i.title);
      const split = full.indexOf(": ");
      const company = split > 0 ? full.slice(0, split) : "Unknown company";
      const title = split > 0 ? full.slice(split + 2) : full;
      const guid = typeof i.guid === "object" ? i.guid["#text"] : i.guid;
      return {
        externalId: guid ?? i.link!,
        title,
        company,
        url: i.link!,
        location: i.region ?? null,
        remote: true,
        description: i.description ? String(i.description) : null,
        postedAt: toIso(i.pubDate),
        employmentType: employmentLabel(i.type),
        seniority: seniorityFromTitle(title),
      };
    });
}

export const weworkremotely: Source = {
  id: "weworkremotely",
  name: "We Work Remotely",
  description: "Long-running remote board with a design section.",
  mixedRoles: false,
  minIntervalMinutes: 60,
  defaultEnabled: true,
  fetch: async (ctx) => parseWeWorkRemotely(await ctx.fetchText("https://weworkremotely.com/categories/remote-design-jobs.rss")),
};
