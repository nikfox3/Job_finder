import type { JobInput, Source } from "./types";
import { decodeEntities, isRemoteText, seniorityFromTitle, toIso } from "./util";

type HnComment = { id: number; text?: string | null; created_at?: string; author?: string; children?: unknown[] };

const URL_RE = /https?:\/\/[^\s<>"')]+/g;
const JOBS_LINK = /\/(careers?|jobs)(\/|$)|greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com|recruitee\.com|breezy\.hr/i;
const ROLE_WORD = /design|engineer|developer|manager|lead|director|researcher|writer|marketer|analyst|scientist/i;

function plain(html: string) {
  return decodeEntities(html.replace(/<p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&#x2F;/g, "/")).trim();
}

/**
 * One top-level comment in "Ask HN: Who is hiring?". By convention the first
 * line reads "Company | Role | Location | ...", but it's free-form, so the
 * title is the field that names a role (or the whole line).
 */
export function parseHnComment(c: HnComment): JobInput | null {
  if (!c.text) return null;
  const text = plain(c.text);
  const header = text.split("\n")[0].trim();
  if (!header || !header.includes("|")) return null;
  const fields = header.split("|").map((f) => f.replace(URL_RE, "").trim()).filter(Boolean);
  const company = fields[0] ?? "Unknown company";
  const title = fields.slice(1).find((f) => ROLE_WORD.test(f)) ?? header;
  const location = fields.slice(1).find((f) => f !== title && /remote|onsite|on-site|hybrid|\b[A-Z]{2}\b|,/.test(f)) ?? null;
  const urls = (text.match(URL_RE) ?? []).map((u) => u.replace(/[.,;!?)\]]+$/, ""));
  return {
    externalId: String(c.id),
    title,
    company,
    url: `https://news.ycombinator.com/item?id=${c.id}`,
    applyUrl: urls.find((u) => JOBS_LINK.test(u)) ?? urls[0] ?? null,
    location,
    remote: isRemoteText(header),
    description: c.text,
    postedAt: toIso(c.created_at),
    seniority: seniorityFromTitle(title),
  };
}

export function parseHnThread(data: unknown): JobInput[] {
  const children = ((data as { children?: HnComment[] })?.children ?? []) as HnComment[];
  return children.map(parseHnComment).filter((j): j is JobInput => j !== null);
}

export const hackernews: Source = {
  id: "hackernews",
  name: "Hacker News",
  description: "The monthly \"Who is hiring?\" thread: startups, often posted by founders. Filtered to design roles.",
  mixedRoles: true,
  minIntervalMinutes: 360,
  defaultEnabled: true,
  fetch: async (ctx) => {
    // The "whoishiring" account posts the thread each month; its newest hiring story is the current one.
    const search = (await ctx.fetchJson("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=5")) as {
      hits?: { objectID: string; title?: string }[];
    };
    const thread = search.hits?.find((h) => /who is hiring/i.test(h.title ?? ""));
    if (!thread) throw new Error("couldn't find this month's thread");
    return parseHnThread(await ctx.fetchJson(`https://hn.algolia.com/api/v1/items/${thread.objectID}`));
  },
};
