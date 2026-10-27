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
  `
  ALTER TABLE jobs ADD COLUMN company_description TEXT;
  ALTER TABLE jobs ADD COLUMN company_industry TEXT;
  ALTER TABLE jobs ADD COLUMN company_size TEXT;
  ALTER TABLE jobs ADD COLUMN company_website TEXT;
  `,
  `
  ALTER TABLE jobs ADD COLUMN apply_account TEXT;
  CREATE TABLE source_runs (
    source    TEXT PRIMARY KEY,
    ran_at    TEXT NOT NULL,
    found     INTEGER NOT NULL DEFAULT 0,
    added     INTEGER NOT NULL DEFAULT 0,
    error     TEXT
  );
  CREATE INDEX jobs_posted_at ON jobs (posted_at);
  `,
  `
  CREATE TABLE answers (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    question  TEXT NOT NULL,
    answer    TEXT NOT NULL DEFAULT '',
    position  INTEGER NOT NULL DEFAULT 0
  );
  INSERT INTO answers (question, position) VALUES
    ('Are you legally authorized to work in the United States?', 1),
    ('Will you now or in the future require visa sponsorship?', 2),
    ('What are your salary expectations?', 3),
    ('When can you start?', 4),
    ('How many years of design experience do you have?', 5),
    ('What time zone do you work in?', 6),
    ('Are you willing to relocate?', 7),
    ('How did you hear about this role?', 8);

  CREATE TABLE documents (
    job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK (kind IN ('cover_letter','resume')),
    content     TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (job_id, kind)
  );
  `,
  `
  ALTER TABLE jobs ADD COLUMN closed_at TEXT;
  ALTER TABLE jobs ADD COLUMN checked_at TEXT;
  `,
];

function migrate(db: Database.Database) {
  // IMMEDIATE takes the write lock before reading the version, so parallel
  // processes (e.g. Next.js build workers) can't apply the same migration twice.
  db.transaction(() => {
    const version = db.pragma("user_version", { simple: true }) as number;
    for (let i = version; i < MIGRATIONS.length; i++) db.exec(MIGRATIONS[i]);
    db.pragma(`user_version = ${MIGRATIONS.length}`);
  }).immediate();
  return db;
}

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return migrate(db);
}

// Reuse one connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { careerOpsDb?: Database.Database };
// A reused connection still gets any migrations added since it was opened.
export const db = globalForDb.careerOpsDb ? migrate(globalForDb.careerOpsDb) : open();
if (process.env.NODE_ENV !== "production") globalForDb.careerOpsDb = db;
