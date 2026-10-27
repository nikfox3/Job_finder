import type { Job } from "./jobs";
import type { Profile } from "./profile";
import type { Settings } from "./settings";

export type FitReason = { label: string; met: boolean };
export type Fit = { score: number; reasons: FitReason[]; needsResume: boolean };

const STOPWORDS = new Set(["and", "the", "for", "with", "of", "a", "an", "to", "in", "senior", "junior", "lead", "staff"]);

function words(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * A quick, local fit score (0-100) from your profile and search settings.
 * No AI and nothing leaves your machine. Weights:
 *   role match 35 · skills match 40 · remote 15 · salary listed 10
 */
export function scoreFit(job: Job, profile: Profile, settings: Settings): Fit {
  const reasons: FitReason[] = [];
  const you = `${profile.headline ?? ""} ${profile.resume_text ?? ""}`.toLowerCase();
  const needsResume = !profile.resume_text;

  // Role: does the title match one of your search keywords?
  const keywords = settings.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
  const title = job.title.toLowerCase();
  const titleWords = new Set(words(job.title));
  const roleHit = keywords.find((k) => title.includes(k) || words(k).every((w) => titleWords.has(w)));
  const rolePartial = !roleHit && keywords.some((k) => words(k).some((w) => titleWords.has(w)));
  let score = roleHit ? 35 : rolePartial ? 20 : 0;
  reasons.push({ label: roleHit ? `Title matches "${roleHit}"` : "Title is outside your search keywords", met: Boolean(roleHit || rolePartial) });

  // Skills: how many of the job's tags show up in your resume or headline?
  if (job.tags.length) {
    const matched = job.tags.filter((t) => you.includes(t.toLowerCase()));
    score += Math.round((matched.length / job.tags.length) * 40);
    reasons.push({
      label: needsResume ? "Add your resume to match skills" : `${matched.length} of ${job.tags.length} skills on your resume`,
      met: matched.length > 0,
    });
  } else {
    score += 20;
  }

  if (job.remote) score += 15;
  reasons.push({ label: job.remote ? "Remote" : "Not remote", met: job.remote });

  const hasSalary = Boolean(job.salary_min || job.salary_max);
  if (hasSalary) score += 10;
  reasons.push({ label: hasSalary ? "Salary is listed" : "No salary listed", met: hasSalary });

  return { score: Math.min(100, score), reasons, needsResume };
}

export function fitTone(score: number) {
  return score >= 75 ? "success" : score >= 50 ? "warning" : "muted";
}
