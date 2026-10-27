import type { Job } from "./jobs";
import type { Profile } from "./profile";
import { displayUrl } from "./format";

type JobLike = Pick<Job, "title" | "company" | "tags">;
type ProfileLike = Pick<Profile, "full_name" | "headline" | "portfolio_url" | "resume_text">;

/** Bracketed notes like "[Why Acme: ...]" are left in drafts for you to fill in. */
export function findPlaceholders(text: string) {
  return text.match(/\[[^\]\n]{3,}\]/g) ?? [];
}

/** Job skills that also appear in your resume or headline, in the job's order. */
export function matchedSkills(job: JobLike, profile: ProfileLike, limit = 4) {
  const you = `${profile.headline ?? ""} ${profile.resume_text ?? ""}`.toLowerCase();
  return job.tags.filter((t) => t.length > 1 && you.includes(t.toLowerCase())).slice(0, limit);
}

function list(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/**
 * A short, honest cover letter built only from your profile and the posting.
 * Anything it can't know is left as a [bracketed] note to fill in.
 */
export function coverLetterTemplate(job: JobLike, profile: ProfileLike) {
  const headline = profile.headline?.trim();
  const article = headline && /^[aeiou]/i.test(headline) ? "an" : "a";
  const skills = matchedSkills(job, profile);
  const portfolio = displayUrl(profile.portfolio_url);

  const intro = `I'm writing to apply for the ${job.title} role at ${job.company}.${headline ? ` I'm ${article} ${headline}, and this role is a strong match for the work I do best.` : ""}`;
  const middle = skills.length
    ? `My experience with ${list(skills)} lines up closely with what you're looking for. [Add one result from your work that shows this, ideally with a number.]`
    : "[Add one or two results from your work that match this role, ideally with numbers.]";
  const why = `[Why ${job.company}: one sentence about what draws you to the team or product.]`;
  const work = portfolio ? ` You can see examples of my work at ${portfolio}.` : "";

  return [
    `Dear ${job.company} hiring team,`,
    intro,
    middle,
    why,
    `Thank you for your time. I'd welcome the chance to talk about how I can help ${job.company}.${work}`,
    `Sincerely,\n${profile.full_name?.trim() || "[Your name]"}`,
  ].join("\n\n");
}

export type ResumeBlock = { type: "heading" | "text" | "bullets"; lines: string[] };

const BULLET = /^\s*[-•*▪–]\s+/;

function isHeading(line: string) {
  if (/^#{1,3}\s/.test(line)) return true;
  if (line.length > 40) return false;
  if (/^[A-Z][^.!?]*:$/.test(line)) return true;
  // EXPERIENCE, WORK HISTORY ...
  return /[A-Z]{3}/.test(line) && line === line.toUpperCase();
}

/**
 * Turns a plain-text resume into blocks for printing. Lines in caps, ending
 * with ":" or starting with "#" become headings; "-" or "•" lines become bullets.
 * Leading lines that repeat your name or contact details are dropped, since the
 * printed header already shows them.
 */
export function parseResume(text: string, contact: string[] = []): ResumeBlock[] {
  const known = contact.map((c) => c.trim().toLowerCase()).filter(Boolean);
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trimEnd());
  while (lines.length && (!lines[0].trim() || known.some((k) => lines[0].toLowerCase().includes(k)))) lines.shift();

  const blocks: ResumeBlock[] = [];
  let last: ResumeBlock | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      last = null;
      continue;
    }
    if (isHeading(line)) {
      blocks.push({ type: "heading", lines: [line.replace(/^#+\s*/, "").replace(/:$/, "")] });
      last = null;
    } else if (BULLET.test(line)) {
      if (last?.type !== "bullets") blocks.push((last = { type: "bullets", lines: [] }));
      last.lines.push(line.replace(BULLET, ""));
    } else {
      if (last?.type !== "text") blocks.push((last = { type: "text", lines: [] }));
      last.lines.push(line);
    }
  }
  return blocks;
}
