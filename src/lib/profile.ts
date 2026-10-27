import "server-only";
import { db } from "./db";

export const PROFILE_FIELDS = [
  "full_name",
  "email",
  "phone",
  "location",
  "headline",
  "portfolio_url",
  "linkedin_url",
  "resume_text",
] as const;

export type Profile = Record<(typeof PROFILE_FIELDS)[number], string | null>;

export function getProfile(): Profile {
  return db.prepare(`SELECT ${PROFILE_FIELDS.join(", ")} FROM profile WHERE id = 1`).get() as Profile;
}

export function saveProfile(profile: Partial<Profile>) {
  const keys = PROFILE_FIELDS.filter((k) => k in profile);
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE profile SET ${set}, updated_at = datetime('now') WHERE id = 1`).run(profile);
}
