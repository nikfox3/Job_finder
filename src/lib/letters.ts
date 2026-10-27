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

/** The resume bullet that best shows a skill this job asks for, or the first one. */
export function bestBullet(job: JobLike, profile: ProfileLike) {
  const bullets = (profile.resume_text ?? "")
    .split("\n")
    .filter((l) => BULLET.test(l))
    .map((l) => l.replace(BULLET, "").trim().replace(/\.$/, ""));
  const skills = job.tags.map((t) => t.toLowerCase());
  return bullets.find((b) => skills.some((s) => b.toLowerCase().includes(s))) ?? bullets[0] ?? null;
}

/** "Built a design system" -> "built a design system", but leaves "UX audits" alone. */
function lowerFirst(text: string) {
  return /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

/**
 * A short, honest cover letter built only from your profile and the posting.
 * It never leaves blanks: anything it doesn't know is simply left out.
 */
export function coverLetterTemplate(job: JobLike, profile: ProfileLike) {
  const headline = profile.headline?.trim();
  const article = headline && /^[aeiou]/i.test(headline) ? "an" : "a";
  const skills = matchedSkills(job, profile);
  const example = bestBullet(job, profile);
  const portfolio = displayUrl(profile.portfolio_url);

  const intro = `I'm writing to apply for the ${job.title} role at ${job.company}.${headline ? ` I'm ${article} ${headline}, and this role is a strong match for the work I do best.` : ""}`;
  const middle = [
    skills.length ? `My experience with ${list(skills)} lines up closely with what you're looking for.` : "My background lines up closely with the work this role involves.",
    example && `For example, I ${lowerFirst(example)}.`,
  ]
    .filter(Boolean)
    .join(" ");
  const work = portfolio ? ` You can see examples of my work at ${portfolio}.` : "";

  return [
    `Dear ${job.company} hiring team,`,
    intro,
    middle,
    `I'd love to bring that experience to ${job.company}, and I'd welcome the chance to talk about how I can help.${work}`,
    ["Sincerely,", profile.full_name?.trim()].filter(Boolean).join("\n"),
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
