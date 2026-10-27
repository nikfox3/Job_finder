import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Job } from "./jobs";
import type { Profile } from "./profile";
import { getSecret, getSettings } from "./settings";
import { htmlToText } from "./work-auth";
import { displayUrl } from "./format";

// Optional: everything works without a key, using the templates in lib/letters.ts.
const MODEL = "claude-opus-5-5";

export function aiKey() {
  return getSecret("anthropic_api_key") ?? process.env.ANTHROPIC_API_KEY ?? null;
}

const RULES = `Use only facts found in the resume and profile. Never invent employers, job titles, dates, numbers, tools or skills. If a useful detail is missing, leave a short [bracketed note] telling the candidate what to add. Write plain text with no markdown.`;

function context(job: Job, profile: Profile) {
  const description = htmlToText(job.description ?? "").slice(0, 12000);
  const about = [
    profile.full_name && `Name: ${profile.full_name}`,
    profile.headline && `Headline: ${profile.headline}`,
    profile.location && `Location: ${profile.location}`,
    profile.portfolio_url && `Portfolio: ${displayUrl(profile.portfolio_url)}`,
  ].filter(Boolean);
  return `<job>
Title: ${job.title}
Company: ${job.company}
${job.company_description ? `About the company: ${job.company_description}\n` : ""}Skills listed: ${job.tags.join(", ") || "none"}

${description}
</job>

<candidate>
${about.join("\n")}
</candidate>

<resume>
${profile.resume_text ?? ""}
</resume>`;
}

async function write(system: string, prompt: string) {
  const apiKey = aiKey();
  if (!apiKey) throw new Error("Add your Anthropic API key in Settings to use AI writing.");
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "medium" },
      // If the model declines, the API retries on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") throw new Error("Claude declined to write this one. Try the template instead.");
    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    if (!text) throw new Error("Claude returned an empty draft. Try again.");
    return text;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new Error("Your Anthropic API key was rejected. Check it in Settings.");
    if (error instanceof Anthropic.RateLimitError) throw new Error("Anthropic is rate limiting requests. Try again in a minute.");
    if (error instanceof Anthropic.APIConnectionError) throw new Error("Couldn't reach Anthropic. Check your internet connection.");
    throw error;
  }
}

const CLICHES = ["I am excited to apply", "I am writing to express my interest", "passionate", "dynamic", "fast-paced", "team player", "perfect fit", "leverage", "synergy", "proven track record"];

/** Your own writing rules from Settings, applied after the honesty rules. */
function preferences() {
  const guide = getSettings().writingGuide.trim();
  return guide
    ? `\n\n<candidate_preferences>\n${guide}\n</candidate_preferences>\nFollow these preferences unless they conflict with the rule against inventing facts.`
    : "";
}

export function writeCoverLetter(job: Job, profile: Profile) {
  return write(
    `You write cover letters for a job seeker. Each letter is about one specific job: a hiring manager should be able to tell from the letter alone which role and company it was written for.

Before writing, work out:
1. The 2 or 3 things this posting cares about most: its main responsibilities and must-have skills, in the posting's own words.
2. For each one, the strongest matching evidence in the resume: a project, a result or a skill.
3. One specific detail about the company, product or team from the posting that gives a real reason to want this job.

Then write the letter:
- 120 to 180 words in total, never more than 200. A greeting, three short paragraphs and a sign-off.
- Paragraph 1, one or two sentences: name the role and connect the candidate's main strength to what this team needs most.
- Paragraph 2: two or three of the posting's priorities, each backed by concrete evidence from the resume. Use the posting's terms where the resume supports them.
- Paragraph 3, one or two sentences: why this company, using the specific detail, then a simple close.
- Don't retell the resume or list every job. Use only the evidence that matches this posting.
- Plain, confident and conversational, with short sentences. Avoid stock phrases such as ${CLICHES.map((c) => `"${c}"`).join(", ")}.
- ${RULES}
- Start with "Dear ${job.company} hiring team," and end with "Sincerely," followed by the candidate's name. Return only the letter.${preferences()}`,
    `${context(job, profile)}\n\nWrite a cover letter for the ${job.title} role at ${job.company}.`,
  );
}

export function tailorResume(job: Job, profile: Profile) {
  return write(
    `You tailor resumes to a specific job. ${RULES} Keep every employer, title and date from the original. Reorder sections and bullets so the most relevant come first, tighten wording, and use the job's terms only where the resume already supports them. Put each section heading in capitals on its own line and start bullets with "- ". Leave out the name and contact lines.`,
    `${context(job, profile)}\n\nTailor this resume for the job. Return only the resume.`,
  );
}

export type AnswerLength = "short" | "medium" | "long";
const LENGTHS: Record<AnswerLength, string> = {
  short: "2 or 3 sentences",
  medium: "one paragraph of about 80 to 120 words",
  long: "two short paragraphs, under 250 words",
};

/** Drafts an answer to one application question, in the candidate's own voice. */
export function answerQuestion(job: Job, profile: Profile, question: string, length: AnswerLength, saved: { question: string; answer: string }[]) {
  const facts = saved.filter((a) => a.answer).map((a) => `Q: ${a.question}\nA: ${a.answer}`);
  return write(
    `You help a job seeker answer questions on job applications. ${RULES} Write in the first person, in a natural, confident voice, as the candidate. Answer the question directly, connect it to this job where it fits, and use a specific example from the resume when one applies. Keep it to ${LENGTHS[length]}. Return only the answer.${preferences()}`,
    `${context(job, profile)}${facts.length ? `\n\n<saved_answers>\n${facts.join("\n\n")}\n</saved_answers>` : ""}\n\n<question>\n${question}\n</question>`,
  );
}
