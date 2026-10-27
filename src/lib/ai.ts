import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Job } from "./jobs";
import type { Profile } from "./profile";
import { getSecret } from "./settings";
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

export function writeCoverLetter(job: Job, profile: Profile) {
  return write(
    `You write cover letters for a job seeker. ${RULES} Keep it under 250 words in 3 or 4 short paragraphs. Be warm and direct, and avoid stock phrases like "I am excited to apply". Start with "Dear ${job.company} hiring team," and end with "Sincerely," followed by the candidate's name.`,
    `${context(job, profile)}\n\nWrite a cover letter for this job.`,
  );
}

export function tailorResume(job: Job, profile: Profile) {
  return write(
    `You tailor resumes to a specific job. ${RULES} Keep every employer, title and date from the original. Reorder sections and bullets so the most relevant come first, tighten wording, and use the job's terms only where the resume already supports them. Put each section heading in capitals on its own line and start bullets with "- ". Leave out the name and contact lines.`,
    `${context(job, profile)}\n\nTailor this resume for the job. Return only the resume.`,
  );
}
