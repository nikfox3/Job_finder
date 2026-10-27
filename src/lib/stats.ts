import "server-only";
import { db } from "./db";

import { STATUSES, type Status } from "./status";

export { STATUSES, type Status };

export function getStats() {
  const jobs = (db.prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number }).n;
  const rows = db.prepare("SELECT status, COUNT(*) AS n FROM applications GROUP BY status").all() as { status: Status; n: number }[];
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s.id, 0])) as Record<Status, number>;
  for (const r of rows) byStatus[r.status] = r.n;
  return { jobs, byStatus };
}
