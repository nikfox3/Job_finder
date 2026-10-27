import "server-only";
import { db } from "./db";

export const JOB_SOURCES = [
  { id: "remotive", name: "Remotive", description: "Curated remote jobs with a strong design category." },
  { id: "remoteok", name: "Remote OK", description: "Large remote-only board, filterable by design tags." },
  { id: "weworkremotely", name: "We Work Remotely", description: "Long-running remote board with a design section." },
  { id: "himalayas", name: "Himalayas", description: "Remote jobs with salary and timezone data." },
] as const;

export type JobSourceId = (typeof JOB_SOURCES)[number]["id"];

export type Settings = {
  autoSubmit: boolean;
  remoteOnly: boolean;
  hideAccountRequired: boolean;
  keywords: string;
  sources: Record<JobSourceId, boolean>;
};

export const DEFAULT_SETTINGS: Settings = {
  autoSubmit: false,
  remoteOnly: true,
  hideAccountRequired: false,
  keywords: "product designer, ux designer, ui designer",
  sources: { remotive: true, remoteok: true, weworkremotely: true, himalayas: true },
};

export function getSettings(): Settings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]));
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    sources: { ...DEFAULT_SETTINGS.sources, ...(stored.sources ?? {}) },
  };
}

export function saveSettings(patch: Partial<Settings>) {
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  db.transaction(() => {
    for (const [key, value] of Object.entries(patch)) upsert.run(key, JSON.stringify(value));
  })();
}
