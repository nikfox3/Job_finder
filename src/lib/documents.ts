import "server-only";
import { db } from "./db";

export type DocKind = "cover_letter" | "resume";
export const DOC_KINDS: DocKind[] = ["cover_letter", "resume"];

export type Doc = { content: string; updated_at: string };

export function getDocument(jobId: number, kind: DocKind): Doc | null {
  return (db.prepare("SELECT content, updated_at FROM documents WHERE job_id = ? AND kind = ?").get(jobId, kind) as Doc | undefined) ?? null;
}

export function saveDocument(jobId: number, kind: DocKind, content: string) {
  db.prepare(
    `INSERT INTO documents (job_id, kind, content) VALUES (?, ?, ?)
     ON CONFLICT(job_id, kind) DO UPDATE SET content = excluded.content, updated_at = datetime('now')`,
  ).run(jobId, kind, content);
}

export function deleteDocument(jobId: number, kind: DocKind) {
  db.prepare("DELETE FROM documents WHERE job_id = ? AND kind = ?").run(jobId, kind);
}
