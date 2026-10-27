import "server-only";
import { db } from "./db";

export type Answer = { id: number; question: string; answer: string };

export function listAnswers(): Answer[] {
  return db.prepare("SELECT id, question, answer FROM answers ORDER BY position, id").all() as Answer[];
}

/** Replaces the whole answer bank with the rows given, in order. */
export function saveAnswers(rows: { question: string; answer: string }[]) {
  const insert = db.prepare("INSERT INTO answers (question, answer, position) VALUES (?, ?, ?)");
  db.transaction(() => {
    db.prepare("DELETE FROM answers").run();
    rows.forEach((r, i) => insert.run(r.question, r.answer, i + 1));
  })();
}

export function addAnswer(question: string, answer: string) {
  db.prepare("INSERT INTO answers (question, answer, position) VALUES (?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM answers))").run(question, answer);
}
