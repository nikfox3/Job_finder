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

const RULES = `Use only facts found in the resume, profile and the candidate's answers. Never invent employers, job titles, dates, numbers, tools or skills. If a detail is missing, write around it using what you do have; never leave blanks, brackets or placeholders for the candidate to fill in. Write plain text with no markdown.`;

// Letters and answers speak for one person, even when the resume describes team work.
const VOICE = `Write as one person applying on their own behalf, in the first person singular ("I", "my"). Never use "we", "our" or "us" for the candidate. When the resume describes team work, make the candidate's own part clear, as in "I led..." or "I worked with engineers to...". Only use "you" and "your team" for the company.`;

export type Fact = { question: string; answer: string };

function factsBlock(facts: Fact[]) {
  const known = facts.filter((f) => f.answer.trim()).map((f) => `Q: ${f.question}\nA: ${f.answer}`);
  // Saved answers are background the writer may draw on, not a checklist to cover.
  return known.length
    ? `\n\n<candidate_answers>\nThings the candidate has told you before. Use one only when it makes this piece stronger for this job; usually that's few or none. Never list them, and leave out logistics like salary, sponsorship or start date unless asked.\n\n${known.join("\n\n")}\n</candidate_answers>`
    : "";
}

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

async function write(system: string, prompt: string, schema?: Record<string, unknown>) {
  const apiKey = aiKey();
  if (!apiKey) throw new Error("Add your Anthropic API key in Settings to use AI writing.");
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: schema ? { effort: "medium", format: { type: "json_schema", schema } } : { effort: "medium" },
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

export function writeCoverLetter(job: Job, profile: Profile, facts: Fact[] = []) {
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
- ${VOICE}
- ${RULES}
- Start with "Dear ${job.company} hiring team," and end with "Sincerely," followed by the candidate's name. Return only the letter.${preferences()}`,
    `${context(job, profile)}${factsBlock(facts)}\n\nWrite a cover letter for the ${job.title} role at ${job.company}.`,
  );
}

export function tailorResume(job: Job, profile: Profile, facts: Fact[] = []) {
  return write(
    `You tailor resumes to a specific job. ${RULES} Keep every employer, title and date from the original. Reorder sections and bullets so the most relevant come first, tighten wording, and use the job's terms only where the resume already supports them. Put each section heading in capitals on its own line and start bullets with "- ". Leave out the name and contact lines.`,
    `${context(job, profile)}${factsBlock(facts)}\n\nTailor this resume for the job. Return only the resume.`,
  );
}

export type AnswerLength = "short" | "medium" | "long";
const LENGTHS: Record<AnswerLength, string> = {
  short: "2 or 3 sentences",
  medium: "one paragraph of about 80 to 120 words",
  long: "two short paragraphs, under 250 words",
};

/** Drafts an answer to one application question, in the candidate's own voice. */
export function answerQuestion(job: Job, profile: Profile, question: string, length: AnswerLength, saved: Fact[]) {
  return write(
    `You help a job seeker answer questions on job applications. ${RULES} ${VOICE} Use a natural, confident voice. Answer the question directly, connect it to this job where it fits, and use a specific example from the resume when one applies. Keep it to ${LENGTHS[length]}. Return only the answer.${preferences()}`,
    `${context(job, profile)}${factsBlock(saved)}\n\n<question>\n${question}\n</question>`,
  );
}

export type QuickQuestion = { question: string; type: "yes_no" | "short" };

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: { question: { type: "string" }, type: { type: "string", enum: ["yes_no", "short"] } },
        required: ["question", "type"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

/**
 * Before writing a cover letter, finds up to 3 quick facts worth asking the
 * candidate for: things the posting stresses that the resume doesn't cover.
 * Usually returns none.
 */
export async function coverLetterQuestions(job: Job, profile: Profile, facts: Fact[]): Promise<QuickQuestion[]> {
  const text = await write(
    `You are about to write a cover letter for a job seeker. First, decide whether a few quick facts from them would make the letter clearly stronger for this specific job.

Compare the posting's top priorities with the resume and the candidate's answers. Only ask about something the posting stresses that those don't already cover, such as a tool, a domain or a type of work. Each question must be answerable with yes or no, or in a few words, for example "Have you used Framer?" or "Have you designed for healthcare products?". Never ask for stories, descriptions, numbers they would need to look up, or anything already answered. Ask at most 3 questions, and ask none if the resume already covers the main priorities.`,
    `${context(job, profile)}${factsBlock(facts)}`,
    QUESTIONS_SCHEMA,
  );
  const parsed = JSON.parse(text) as { questions: QuickQuestion[] };
  return parsed.questions.slice(0, 3);
}
