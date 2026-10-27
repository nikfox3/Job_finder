import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as f from "./fixtures/feeds";

// Point the app at a throwaway database before anything imports it.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "career-ops-test-"));
process.env.CAREER_OPS_DATA_DIR = dir;

const responses: Record<string, unknown> = {
  "remotive.com": f.remotive,
  "remoteok.com": f.remoteok,
  "weworkremotely.com": f.weworkremotely,
  "himalayas.app": f.himalayas,
  "jobicy.com": f.jobicy,
  "www.workingnomads.com": f.workingnomads,
  "boards-api.greenhouse.io": f.greenhouse,
  "www.themuse.com": { results: [], page_count: 0 },
  "4dayweek.io": { jobs: [], has_more: false },
  "nodesk.co": "<rss><channel></channel></rss>",
  "jobspresso.co": "<rss><channel></channel></rss>",
  "builtin.com": "<html></html>",
  "www.welcometothejungle.com": 'window.env = {"PUBLIC_ALGOLIA_APPLICATION_ID":"ABCDEF123","PUBLIC_ALGOLIA_API_KEY_CLIENT":"0123456789abcdef0123"}',
  "abcdef123-dsn.algolia.net": { hits: [] },
  "hn.algolia.com": { hits: [{ objectID: "1", title: "Ask HN: Who is hiring? (October 2026)" }], children: [] },
};

const calls: string[] = [];

beforeAll(() => {
  vi.stubGlobal("fetch", async (input: string) => {
    const url = new URL(input);
    calls.push(url.hostname);
    const isApi = /api|algolia|\.rss$|\.xml$|feed=|builtin\.com/.test(url.hostname + url.pathname + url.search);
    const body = isApi ? responses[url.hostname] : undefined;
    if (body === undefined) return new Response("<html>Apply now <input type=file name=resume></html>", { status: 200 });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200 });
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("refreshJobs", () => {
  it("pulls every enabled source into the database", async () => {
    const { saveSettings } = await import("@/lib/settings");
    saveSettings({ companies: [{ ats: "greenhouse", slug: "kappa", name: "Kappa" }] });
    // A role Kappa has since taken off its careers page.
    const { db } = await import("@/lib/db");
    db.prepare("INSERT INTO jobs (source, external_id, title, company, url) VALUES ('company', 'kappa-999', 'Old Designer', 'Kappa', 'https://x')").run();

    const { refreshJobs } = await import("@/lib/ingest");
    const results = await refreshJobs();
    const byId = Object.fromEntries(results.map((r) => [r.source, r]));

    expect(byId.remotive).toMatchObject({ found: 2, added: 2, error: null });
    // Remote OK and company boards mix in non-design roles, which are filtered out.
    expect(byId.remoteok).toMatchObject({ found: 1, added: 1 });
    expect(byId["company:greenhouse:kappa"]).toMatchObject({ found: 1, added: 1 });
    // Arbeitnow is off by default.
    expect(byId.arbeitnow).toBeUndefined();

    const { listJobs } = await import("@/lib/jobs");
    const jobs = listJobs();
    expect(jobs.length).toBe(9);
    expect(jobs.find((j) => j.title === "Old Designer")!.closed_at).not.toBeNull();
    expect(jobs.filter((j) => j.closed_at)).toHaveLength(1);
    const acme = jobs.find((j) => j.company === "Acme")!;
    expect(acme.description).toBe("<p>Design things.</p>");
  });

  it("respects each source's minimum interval", async () => {
    calls.length = 0;
    const { refreshJobs } = await import("@/lib/ingest");
    const results = await refreshJobs();
    expect(results.every((r) => r.skipped)).toBe(true);
    expect(calls.filter((h) => h in responses)).toEqual([]);
  });

  it("checked unknown apply pages for a sign-up wall", async () => {
    const { db } = await import("@/lib/db");
    const row = db.prepare("SELECT apply_account FROM jobs WHERE company = 'Acme'").get() as { apply_account: string };
    expect(row.apply_account).toBe("no-account");
  });
});
