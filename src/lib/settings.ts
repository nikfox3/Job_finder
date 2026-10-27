import "server-only";
import { db } from "./db";
import { SOURCES } from "./sources";
import type { WatchedCompany } from "./sources/companies";
import type { CustomAgency } from "./agencies";

export type SourceInfo = { id: string; name: string; description: string };

export const JOB_SOURCES: SourceInfo[] = SOURCES.map(({ id, name, description }) => ({ id, name, description }));

export type LocationScope = "home" | "open" | "all";

export type Settings = {
  autoSubmit: boolean;
  remoteOnly: boolean;
  hideAccountRequired: boolean;
  /** ISO country code of where you live, e.g. "US". Empty means not set. */
  homeCountry: string;
  /** Default location filter: only jobs that name your country, jobs you can take, or everything. */
  locationScope: LocationScope;
  keywords: string;
  /** Your own rules for AI writing, e.g. tone or things to always mention. */
  writingGuide: string;
  sources: Record<string, boolean>;
  companies: WatchedCompany[];
  /** Agencies you added on the Agencies page. */
  agencies: CustomAgency[];
};

export const DEFAULT_SETTINGS: Settings = {
  autoSubmit: false,
  remoteOnly: true,
  hideAccountRequired: false,
  homeCountry: "",
  locationScope: "open",
  keywords: "product designer, ux designer, ui designer",
  writingGuide: "",
  sources: Object.fromEntries(SOURCES.map((s) => [s.id, s.defaultEnabled])),
  companies: [],
  agencies: [],
};

export function getSettings(): Settings {
  // Secrets live in the same table but never travel with the settings object.
  const rows = db.prepare("SELECT key, value FROM settings WHERE key NOT LIKE 'secret:%'").all() as { key: string; value: string }[];
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

/** Local secrets, such as your Anthropic API key. Server-only; never sent to the browser. */
export function getSecret(name: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(`secret:${name}`) as { value: string } | undefined;
  return row ? (JSON.parse(row.value) as string) : null;
}

export function setSecret(name: string, value: string | null) {
  if (value) saveSettings({ [`secret:${name}`]: value } as Partial<Settings>);
  else db.prepare("DELETE FROM settings WHERE key = ?").run(`secret:${name}`);
}
