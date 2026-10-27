import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// All data lives in a single local file. Nothing leaves your machine.
const DATA_DIR = process.env.CAREER_OPS_DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "career-ops.db");

// Each entry runs once, in order. Append new migrations; never edit old ones.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE jobs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    source       TEXT NOT NULL,
    external_id  TEXT NOT NULL,
    title        TEXT NOT NULL,
    company      TEXT NOT NULL,
    location     TEXT,
    remote       INTEGER NOT NULL DEFAULT 0,
    salary_min   INTEGER,
    salary_max   INTEGER,
    currency     TEXT,
    url          TEXT NOT NULL,
    apply_url    TEXT,
    description  TEXT,
    tags         TEXT,
    posted_at    TEXT,
    fetched_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source, external_id)
  );

  CREATE TABLE applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'saved'
                CHECK (status IN ('saved','applying','applied','interview','offer','rejected')),
    notes       TEXT,
    applied_at  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (job_id)
  );

  CREATE TABLE profile (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    full_name     TEXT,
    email         TEXT,
    phone         TEXT,
    location      TEXT,
    headline      TEXT,
    portfolio_url TEXT,
    linkedin_url  TEXT,
    resume_text   TEXT,
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  INSERT INTO profile (id) VALUES (1);
  `,
  `
  ALTER TABLE jobs ADD COLUMN employment_type TEXT;
  ALTER TABLE jobs ADD COLUMN seniority TEXT;
  ALTER TABLE jobs ADD COLUMN timezone TEXT;
  `,
];

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // IMMEDIATE takes the write lock before reading the version, so parallel
  // processes (e.g. Next.js build workers) can't apply the same migration twice.
  db.transaction(() => {
    const version = db.pragma("user_version", { simple: true }) as number;
    for (let i = version; i < MIGRATIONS.length; i++) db.exec(MIGRATIONS[i]);
    db.pragma(`user_version = ${MIGRATIONS.length}`);
  }).immediate();
  return db;
}

// Reuse one connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { careerOpsDb?: Database.Database };
export const db = globalForDb.careerOpsDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.careerOpsDb = db;
