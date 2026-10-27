import "server-only";
import { db } from "./db";

export const STATUSES = [
  { id: "saved", label: "Saved" },
  { id: "applying", label: "Applying" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Closed" },
] as const;

export type Status = (typeof STATUSES)[number]["id"];

export function getStats() {
  const jobs = (db.prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number }).n;
  const rows = db.prepare("SELECT status, COUNT(*) AS n FROM applications GROUP BY status").all() as { status: Status; n: number }[];
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s.id, 0])) as Record<Status, number>;
  for (const r of rows) byStatus[r.status] = r.n;
  return { jobs, byStatus };
}
