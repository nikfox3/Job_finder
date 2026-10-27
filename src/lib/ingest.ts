import "server-only";
import sanitizeHtml from "sanitize-html";
import { db } from "./db";
import { getSettings, keywordList } from "./settings";
import { SOURCES } from "./sources";
import { fetchCompany, type WatchedCompany } from "./sources/companies";
import type { FetchContext, JobInput } from "./sources/types";
import { isRelevant } from "./sources/util";
import { CLOSED_PAGE } from "./freshness";
import { applyMethod } from "./apply-method";

const USER_AGENT = "CareerOps/0.1 (personal job search dashboard, runs locally)";
const TIMEOUT_MS = 20_000;
// Jobs nobody saved are cleared out after this many days.
const KEEP_DAYS = 45;

export type RunResult = { source: string; name: string; found: number; added: number; error: string | null; skipped?: boolean };

async function request(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json, application/rss+xml, text/html;q=0.9, */*;q=0.8" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} answered ${res.status}`);
  return res;
}

export const httpContext = (keywords: string[]): FetchContext => ({
  keywords,
  fetchJson: async (url) => (await request(url)).json(),
  fetchText: async (url) => (await request(url)).text(),
});

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "h1", "h2", "h3", "h4", "a", "blockquote"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noreferrer" }) },
  allowedSchemes: ["http", "https", "mailto"],
};

export function cleanDescription(html: string | null | undefined) {
  if (!html) return null;
  // Plain text (no tags) is kept as-is; the UI renders it as paragraphs.
  if (!/<[a-z][\s\S]*>/i.test(html)) return html.trim();
  return sanitizeHtml(html, SANITIZE).trim();
}

const upsert = () =>
  db.prepare(`
    INSERT INTO jobs (source, external_id, title, company, location, remote, salary_min, salary_max, currency, url, apply_url,
                      description, tags, posted_at, employment_type, seniority, timezone,
                      company_description, company_industry, company_size, company_website, fetched_at)
    VALUES (@source, @externalId, @title, @company, @location, @remote, @salaryMin, @salaryMax, @currency, @url, @applyUrl,
            @description, @tags, @postedAt, @employmentType, @seniority, @timezone,
            @companyDescription, @companyIndustry, @companySize, @companyWebsite, datetime('now'))
    ON CONFLICT (source, external_id) DO UPDATE SET
      title = excluded.title, company = excluded.company, location = excluded.location, remote = excluded.remote,
      salary_min = excluded.salary_min, salary_max = excluded.salary_max, currency = excluded.currency,
      url = excluded.url, apply_url = excluded.apply_url, description = excluded.description, tags = excluded.tags,
      posted_at = COALESCE(excluded.posted_at, jobs.posted_at), employment_type = excluded.employment_type,
      seniority = excluded.seniority, timezone = excluded.timezone,
      company_description = COALESCE(excluded.company_description, jobs.company_description),
      company_industry = COALESCE(excluded.company_industry, jobs.company_industry),
      company_size = COALESCE(excluded.company_size, jobs.company_size),
      company_website = COALESCE(excluded.company_website, jobs.company_website),
      fetched_at = datetime('now'), closed_at = NULL
  `);

/** Saves jobs from one source and returns how many were new. */
export function saveJobs(source: string, jobs: JobInput[]) {
  const exists = db.prepare("SELECT 1 FROM jobs WHERE source = ? AND external_id = ?");
  const insert = upsert();
  let added = 0;
  db.transaction(() => {
    for (const j of jobs) {
      if (!exists.get(source, j.externalId)) added++;
      insert.run({
        source,
        externalId: j.externalId,
        title: j.title.trim(),
        company: j.company.trim(),
        location: j.location ?? null,
        remote: j.remote ? 1 : 0,
        salaryMin: j.salaryMin ?? null,
        salaryMax: j.salaryMax ?? null,
        currency: j.currency ?? null,
        url: j.url,
        applyUrl: j.applyUrl ?? null,
        description: cleanDescription(j.description),
        tags: JSON.stringify(j.tags ?? []),
        postedAt: j.postedAt ? j.postedAt.slice(0, 19).replace("T", " ") : null,
        employmentType: j.employmentType ?? null,
        seniority: j.seniority ?? null,
        timezone: j.timezone ?? null,
        companyDescription: j.companyDescription ?? null,
        companyIndustry: j.companyIndustry ?? null,
        companySize: j.companySize ?? null,
        companyWebsite: j.companyWebsite ?? null,
      });
    }
  })();
  return added;
}

function lastRun(id: string) {
  return db.prepare("SELECT ran_at FROM source_runs WHERE source = ? AND error IS NULL").get(id) as { ran_at: string } | undefined;
}

function recordRun(r: RunResult) {
  db.prepare(
    `INSERT INTO source_runs (source, ran_at, found, added, error) VALUES (?, datetime('now'), ?, ?, ?)
     ON CONFLICT (source) DO UPDATE SET ran_at = excluded.ran_at, found = excluded.found, added = excluded.added, error = excluded.error`,
  ).run(r.source, r.found, r.added, r.error);
}

function minutesSince(sqlDate: string) {
  return (Date.now() - new Date(sqlDate.replace(" ", "T") + "Z").getTime()) / 60_000;
}

/**
 * A company careers page lists every open role, so a job that drops off it has
 * closed. (Job boards only return recent pages, so this only applies to companies.)
 */
function closeMissing(source: string, prefix: string, seen: JobInput[]) {
  db.prepare(
    `UPDATE jobs SET closed_at = datetime('now')
     WHERE source = ? AND external_id LIKE ? AND closed_at IS NULL
       AND external_id NOT IN (SELECT value FROM json_each(?))`,
  ).run(source, `${prefix}%`, JSON.stringify(seen.map((j) => j.externalId)));
}

async function runOne(
  id: string,
  name: string,
  minInterval: number,
  load: () => Promise<JobInput[]>,
  keywords: string[],
  mixed: boolean,
  companyPrefix?: string,
): Promise<RunResult> {
  const prev = lastRun(id);
  if (prev && minutesSince(prev.ran_at) < minInterval) return { source: id, name, found: 0, added: 0, error: null, skipped: true };
  try {
    const all = await load();
    const jobs = mixed ? all.filter((j) => isRelevant(j.title, keywords)) : all;
    const source = id.startsWith("company:") ? "company" : id;
    const added = saveJobs(source, jobs);
    if (companyPrefix) closeMissing(source, companyPrefix, all);
    const result = { source: id, name, found: jobs.length, added, error: null };
    recordRun(result);
    return result;
  } catch (e) {
    const result = { source: id, name, found: 0, added: 0, error: describeError(e) };
    recordRun(result);
    return result;
  }
}

const ACCOUNT_WALL = /type=["']?password|create (an |your )?account|sign up to apply|(log|sign) ?in to apply|register to apply/i;
const GUEST_FORM = /type=["']?file|name=["']?(resume|cv)\b|apply (now|for this job)/i;

/** Opens apply pages we can't classify from the link and looks for a sign-up wall. */
export async function checkApplyPages(limit = 15) {
  const rows = db
    .prepare("SELECT id, url, apply_url FROM jobs WHERE apply_account IS NULL ORDER BY posted_at DESC LIMIT 200")
    .all() as { id: number; url: string; apply_url: string | null }[];
  const unknown = rows.filter((r) => applyMethod(r.apply_url ?? r.url).kind === "unknown").slice(0, limit);
  const save = db.prepare("UPDATE jobs SET apply_account = ? WHERE id = ?");
  await Promise.all(
    unknown.map(async (r) => {
      try {
        const res = await fetch(r.apply_url ?? r.url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
        // A redirect to a known system (e.g. Workday) is the strongest signal.
        const redirected = applyMethod(res.url);
        const html = res.ok ? await res.text() : "";
        const verdict =
          redirected.kind !== "unknown" ? redirected.kind : ACCOUNT_WALL.test(html) ? "account" : GUEST_FORM.test(html) ? "no-account" : "unknown";
        save.run(verdict, r.id);
      } catch {
        save.run("unknown", r.id);
      }
    }),
  );
}

/**
 * Re-opens week-old postings, a few per refresh and each at most once a day,
 * to catch ones that were taken down or say they're filled. Jobs on your
 * board go first.
 */
export async function checkStillOpen(limit = 10) {
  const rows = db
    .prepare(
      `SELECT j.id, j.url FROM jobs j LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.closed_at IS NULL AND j.source NOT IN ('sample', 'import')
         AND j.posted_at < datetime('now', '-7 days')
         AND (j.checked_at IS NULL OR j.checked_at < datetime('now', '-1 day'))
       ORDER BY a.job_id IS NULL, j.checked_at IS NOT NULL, j.posted_at DESC
       LIMIT ?`,
    )
    .all(limit) as { id: number; url: string }[];
  const checked = db.prepare("UPDATE jobs SET checked_at = datetime('now') WHERE id = ?");
  const close = db.prepare("UPDATE jobs SET closed_at = datetime('now') WHERE id = ?");
  await Promise.all(
    rows.map(async (r) => {
      try {
        const res = await fetch(r.url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
        // Only a clear "gone" counts; sites that block bots (403, 429) prove nothing.
        const gone = res.status === 404 || res.status === 410 || (res.ok && CLOSED_PAGE.test(await res.text()));
        if (gone) close.run(r.id);
      } catch {
        // Offline or timed out: try again another day.
      }
      checked.run(r.id);
    }),
  );
}

function describeError(e: unknown) {
  if (e instanceof Error && e.name === "TimeoutError") return "took too long to answer";
  // Node's fetch reports DNS/connection problems as a bare "fetch failed".
  if (e instanceof TypeError && e.message === "fetch failed") return "couldn't connect (are you online?)";
  if (e instanceof SyntaxError) return "sent something unexpected (its format may have changed)";
  return e instanceof Error ? e.message : String(e);
}

let running: Promise<RunResult[]> | null = null;

/** Pulls every enabled source. Safe to call often: sources are rate limited and concurrent calls share one run. */
export function refreshJobs(): Promise<RunResult[]> {
  running ??= (async () => {
    const settings = getSettings();
    const keywords = keywordList(settings);
    const ctx = httpContext(keywords);
    const boards = SOURCES.filter((s) => settings.sources[s.id]).map((s) =>
      runOne(s.id, s.name, s.minIntervalMinutes, () => s.fetch(ctx), keywords, s.mixedRoles),
    );
    const companies = settings.companies.map((c: WatchedCompany) =>
      runOne(`company:${c.ats}:${c.slug}`, c.name, 60, () => fetchCompany(c, ctx), keywords, true, `${c.slug}-`),
    );
    const results = await Promise.all([...boards, ...companies]);
    await Promise.all([checkApplyPages(), checkStillOpen()]);
    db.prepare(
      `DELETE FROM jobs WHERE fetched_at < datetime('now', ?) AND source NOT IN ('sample', 'import')
       AND id NOT IN (SELECT job_id FROM applications)`,
    ).run(`-${KEEP_DAYS} days`);
    return results;
  })().finally(() => {
    running = null;
  });
  return running;
}

export function lastRefresh() {
  const row = db.prepare("SELECT MAX(ran_at) AS at FROM source_runs WHERE error IS NULL").get() as { at: string | null };
  return row.at;
}

export function sourceRuns() {
  return db.prepare("SELECT * FROM source_runs ORDER BY source").all() as {
    source: string;
    ran_at: string;
    found: number;
    added: number;
    error: string | null;
  }[];
}
