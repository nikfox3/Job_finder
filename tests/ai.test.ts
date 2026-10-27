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
vi.mock("@/lib/settings", () => ({ getSecret: () => "sk-ant-test" }));

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

  it("reports a refusal instead of returning partial text", async () => {
    create.mockResolvedValue({ stop_reason: "refusal", content: [{ type: "text", text: "partial" }] });
    await expect(writeCoverLetter(job, profile)).rejects.toThrow(/declined/);
  });
});
