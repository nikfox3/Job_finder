import "server-only";
import { db } from "./db";
import { SOURCES } from "./sources";
import type { WatchedCompany } from "./sources/companies";

export type SourceInfo = { id: string; name: string; description: string };

export const JOB_SOURCES: SourceInfo[] = SOURCES.map(({ id, name, description }) => ({ id, name, description }));

export type Settings = {
  autoSubmit: boolean;
  remoteOnly: boolean;
  hideAccountRequired: boolean;
  /** ISO country code of where you live, e.g. "US". Empty means not set. */
  homeCountry: string;
  keywords: string;
  sources: Record<string, boolean>;
  companies: WatchedCompany[];
};

export const DEFAULT_SETTINGS: Settings = {
  autoSubmit: false,
  remoteOnly: true,
  hideAccountRequired: false,
  homeCountry: "",
  keywords: "product designer, ux designer, ui designer",
  sources: Object.fromEntries(SOURCES.map((s) => [s.id, s.defaultEnabled])),
  companies: [],
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

export function keywordList(settings: Settings) {
  return settings.keywords.split(",").map((k) => k.trim()).filter(Boolean);
}
