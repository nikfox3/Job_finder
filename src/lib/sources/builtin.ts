import type { JobInput, Source } from "./types";
import { decodeEntities, isRemoteText, seniorityFromTitle } from "./util";

// Each results page carries a schema.org ItemList (stable, for search engines)
// plus rendered job cards with company, location and salary.
const ITEM = /\{"@type":"ListItem","position":\d+,"name":("(?:[^"\\]|\\.)*"),"url":("(?:[^"\\]|\\.)*")(?:,"description":("(?:[^"\\]|\\.)*"))?\}/g;
const CARD = /data-id="job-card-title"/g;
const CARD_ID = /data-builtin-track-job-id="(\d+)"/;
const COMPANY = /<a[^>]+href="\/company\/[^"]*"[^>]*>([\s\S]{0,240}?)<\/a>/g;
const SALARY = /^(\d+(?:\.\d+)?)K(?:-(\d+(?:\.\d+)?)K)?\s+Annually$/i;

function strip(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** The first bit of text after a card's FontAwesome icon, e.g. fa-location-dot. */
function afterIcon(card: string, icon: string) {
  const at = card.indexOf(icon);
  if (at === -1) return "";
  for (const m of card.slice(at, at + 600).matchAll(/>([^<>]+)</g)) {
    const text = decodeEntities(m[1]).trim();
    if (text) return text;
  }
  return "";
}

type Card = { company?: string; location?: string; mode?: string; salary?: string };

function cards(html: string) {
  const byId = new Map<string, Card>();
  const starts = [...html.matchAll(CARD)].map((m) => m.index!);
  starts.forEach((start, i) => {
    const card = html.slice(start, starts[i + 1] ?? start + 12_000);
    const id = card.match(CARD_ID)?.[1];
    if (!id) return;
    // The company link sits just before the card title.
    const before = html.slice(Math.max(0, start - 3000), start);
    const company = [...before.matchAll(COMPANY)].at(-1)?.[1];
    byId.set(id, {
      company: company ? strip(company) : undefined,
      location: afterIcon(card, "fa-location-dot"),
      mode: afterIcon(card, "fa-house-building"),
      salary: afterIcon(card, "fa-sack-dollar"),
    });
  });
  return byId;
}

export function parseBuiltIn(html: string): JobInput[] {
  const details = cards(html);
  const jobs: JobInput[] = [];
  for (const m of html.matchAll(ITEM)) {
    const title = JSON.parse(m[1]) as string;
    const url = JSON.parse(m[2]) as string;
    const id = url.match(/(\d+)\/?$/)?.[1];
    if (!title || !id) continue;
    const card = details.get(id) ?? {};
    const salary = card.salary?.match(SALARY);
    const place = card.location && !/^\d+\s+Locations?$/i.test(card.location) ? card.location : "";
    const location = [place, card.mode].filter(Boolean).join(" · ") || null;
    jobs.push({
      externalId: id,
      title,
      company: card.company || "Unknown company",
      url,
      location,
      remote: isRemoteText(card.mode) || isRemoteText(place),
      salaryMin: salary ? Math.round(Number(salary[1]) * 1000) : null,
      salaryMax: salary ? Math.round(Number(salary[2] ?? salary[1]) * 1000) : null,
      currency: salary ? "USD" : null,
      description: m[3] ? (JSON.parse(m[3]) as string) : null,
      seniority: seniorityFromTitle(title),
    });
  }
  return jobs;
}

const PAGES = 3;

export const builtin: Source = {
  id: "builtin",
  name: "Built In",
  description: "Large US tech job board. Remote design and UX roles.",
  mixedRoles: true,
  minIntervalMinutes: 180,
  defaultEnabled: true,
  fetch: async (ctx) => {
    // The design category page, or a plain search if that page ever moves.
    let base = "https://builtin.com/jobs/remote/design-ux?";
    let html: string;
    try {
      html = await ctx.fetchText(`${base}page=1`);
    } catch {
      base = "https://builtin.com/jobs/remote?search=designer&";
      html = await ctx.fetchText(`${base}page=1`);
    }
    const out = new Map<string, JobInput>();
    for (let page = 1; page <= PAGES; page++) {
      const jobs = parseBuiltIn(page === 1 ? html : await ctx.fetchText(`${base}page=${page}`));
      jobs.forEach((j) => out.set(j.externalId, j));
      if (jobs.length === 0) break;
    }
    return [...out.values()];
  },
};
