import "server-only";
import { db } from "./db";
import type { Status } from "./stats";

export type Job = {
  id: number;
  source: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  url: string;
  apply_url: string | null;
  description: string | null;
  tags: string[];
  posted_at: string | null;
  employment_type: string | null;
  seniority: string | null;
  timezone: string | null;
  company_description: string | null;
  company_industry: string | null;
  company_size: string | null;
  company_website: string | null;
  apply_account: string | null;
  /** Set when the posting disappeared from its careers page or says it's closed. */
  closed_at: string | null;
  status: Status | null;
};

export type JobFilters = {
  q?: string;
  source?: string;
  remote?: boolean;
  minSalary?: number;
  posted?: "1" | "7" | "30";
};

type Row = Omit<Job, "remote" | "tags"> & { remote: number; tags: string | null };

const SELECT = `
  SELECT j.*, a.status
  FROM jobs j
  LEFT JOIN applications a ON a.job_id = j.id
`;

function toJob(row: Row): Job {
  return { ...row, remote: Boolean(row.remote), tags: row.tags ? JSON.parse(row.tags) : [] };
}

export function listJobs(filters: JobFilters = {}): Job[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.q) {
    where.push("(j.title LIKE @q OR j.company LIKE @q OR j.tags LIKE @q)");
    params.q = `%${filters.q}%`;
  }
  if (filters.source) {
    where.push("j.source = @source");
    params.source = filters.source;
  }
  if (filters.remote) where.push("j.remote = 1");
  if (filters.minSalary) {
    where.push("COALESCE(j.salary_max, j.salary_min) >= @minSalary");
    params.minSalary = filters.minSalary;
  }
  if (filters.posted) {
    where.push(`j.posted_at >= datetime('now', @posted)`);
    params.posted = `-${filters.posted} days`;
  }
  const sql = `${SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY j.posted_at DESC`;
  return (db.prepare(sql).all(params) as Row[]).map(toJob);
}

export function getJob(id: number): Job | null {
  const row = db.prepare(`${SELECT} WHERE j.id = ?`).get(id) as Row | undefined;
  return row ? toJob(row) : null;
}

export function listJobSources(): string[] {
  return (db.prepare("SELECT DISTINCT source FROM jobs ORDER BY source").all() as { source: string }[]).map((r) => r.source);
}
