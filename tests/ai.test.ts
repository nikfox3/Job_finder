import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class Anthropic {
    static AuthenticationError = actual.default.AuthenticationError;
    static RateLimitError = actual.default.RateLimitError;
    static APIConnectionError = actual.default.APIConnectionError;
    beta = { messages: { create } };
  }
  return { default: Anthropic };
});
const settings = { writingGuide: "" };
vi.mock("@/lib/settings", () => ({ getSecret: () => "sk-ant-test", getSettings: () => settings }));

const { writeCoverLetter } = await import("@/lib/ai");

const job = {
  id: 1, source: "remotive", title: "Product Designer", company: "Acme", location: null, remote: true, salary_min: null, salary_max: null,
  currency: null, url: "https://x", apply_url: null, description: "<p>Design things.</p>", tags: ["Figma"], posted_at: null,
  employment_type: null, seniority: null, timezone: null, company_description: null, company_industry: null, company_size: null,
  company_website: null, apply_account: null, status: null,
};
const profile = { full_name: "Nik Fox", email: null, phone: null, location: null, headline: null, portfolio_url: null, linkedin_url: null, resume_text: "Figma" };

describe("writeCoverLetter", () => {
  beforeEach(() => create.mockReset());

  it("asks for a letter with server-side fallbacks and returns the text", async () => {
    create.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "Dear Acme hiring team," }] });
    await expect(writeCoverLetter(job, profile)).resolves.toBe("Dear Acme hiring team,");
    const params = create.mock.calls[0][0];
    expect(params).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default", betas: ["server-side-fallback-2026-07-01"] });
    expect(params.messages[0].content).toContain("Design things.");
    expect(params.messages[0].content).not.toContain("<p>");
  });

  it("asks for a short letter about this job and adds your writing rules", async () => {
    create.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "Dear Acme hiring team," }] });
    settings.writingGuide = "Mention I work well with engineers.";
    await writeCoverLetter(job, profile);
    settings.writingGuide = "";
    const { system, messages } = create.mock.calls[0][0];
    expect(system).toContain("never more than 200");
    expect(system).toContain("<candidate_preferences>\nMention I work well with engineers.\n</candidate_preferences>");
    expect(messages[0].content).toContain("the Product Designer role at Acme");
  });

  it("reports a refusal instead of returning partial text", async () => {
    create.mockResolvedValue({ stop_reason: "refusal", content: [{ type: "text", text: "partial" }] });
    await expect(writeCoverLetter(job, profile)).rejects.toThrow(/declined/);
  });
});

describe("answerQuestion", () => {
  beforeEach(() => create.mockReset());

  it("includes the question, the length and saved answers", async () => {
    const { answerQuestion } = await import("@/lib/ai");
    create.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "I led..." }] });
    await expect(
      answerQuestion(job, profile, "Why this role?", "short", [
        { question: "Salary?", answer: "$120k" },
        { question: "Start date?", answer: "" },
      ]),
    ).resolves.toBe("I led...");
    const params = create.mock.calls[0][0];
    expect(params.system).toContain("2 or 3 sentences");
    expect(params.messages[0].content).toContain("<question>\nWhy this role?\n</question>");
    expect(params.messages[0].content).toContain("A: $120k");
    expect(params.messages[0].content).not.toContain("Start date?");
  });
});

describe("coverLetterQuestions", () => {
  beforeEach(() => create.mockReset());

  it("requests structured output and caps the list at 3", async () => {
    const { coverLetterQuestions } = await import("@/lib/ai");
    const qs = [1, 2, 3, 4].map((n) => ({ question: `Q${n}?`, type: "yes_no" }));
    create.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ questions: qs }) }] });
    await expect(coverLetterQuestions(job, profile, [{ question: "Used Framer?", answer: "Yes" }])).resolves.toHaveLength(3);
    const params = create.mock.calls[0][0];
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.messages[0].content).toContain("A: Yes");
  });

  it("passes quick answers into the letter", async () => {
    create.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "Dear Acme hiring team," }] });
    await writeCoverLetter(job, profile, [{ question: "Have you used Framer?", answer: "Yes, daily" }]);
    expect(create.mock.calls[0][0].messages[0].content).toContain("Q: Have you used Framer?\nA: Yes, daily");
    expect(create.mock.calls[0][0].system).toContain("never leave blanks");
  });
});
