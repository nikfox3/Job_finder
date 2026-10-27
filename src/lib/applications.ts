import "server-only";
import { db } from "./db";
import type { Status } from "./stats";

export type BoardCard = {
  job_id: number;
  status: Status;
  title: string;
  company: string;
  location: string | null;
  remote: number;
  closed_at: string | null;
  applied_at: string | null;
  updated_at: string;
};

/** Sets a job's place on the board, or removes it when status is null. */
export function setStatus(jobId: number, status: Status | null) {
  if (status === null) {
    db.prepare("DELETE FROM applications WHERE job_id = ?").run(jobId);
    return;
  }
  db.prepare(
    `INSERT INTO applications (job_id, status, applied_at) VALUES (@jobId, @status, CASE WHEN @status = 'applied' THEN datetime('now') END)
     ON CONFLICT (job_id) DO UPDATE SET
       status = excluded.status,
       applied_at = COALESCE(applications.applied_at, excluded.applied_at),
       updated_at = datetime('now')`,
  ).run({ jobId, status });
}

export function getStatus(jobId: number): Status | null {
  const row = db.prepare("SELECT status FROM applications WHERE job_id = ?").get(jobId) as { status: Status } | undefined;
  return row?.status ?? null;
}

export function listBoard(): BoardCard[] {
  return db
    .prepare(
      `SELECT a.job_id, a.status, a.applied_at, a.updated_at, j.title, j.company, j.location, j.remote, j.closed_at
       FROM applications a JOIN jobs j ON j.id = a.job_id
       ORDER BY a.updated_at DESC`,
    )
    .all() as BoardCard[];
}
