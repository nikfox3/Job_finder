import { describe, expect, it } from "vitest";
import { coverLetterTemplate, findPlaceholders, matchedSkills, parseResume } from "@/lib/letters";
import { displayUrl } from "@/lib/format";

const job = { title: "Product Designer", company: "Acme", tags: ["Figma", "Design systems", "SQL"] };
const profile = {
  full_name: "Nik Fox",
  headline: "Senior Product Designer",
  portfolio_url: "https://Nikfox.design",
  resume_text: "Built design systems in Figma for 40 teams.\n- Ran weekly user interviews\n- Built the Figma component library used by 6 teams.",
};

describe("coverLetterTemplate", () => {
  const letter = coverLetterTemplate(job, profile);

  it("addresses the company and names the role", () => {
    expect(letter.startsWith("Dear Acme hiring team,")).toBe(true);
    expect(letter).toContain("the Product Designer role at Acme");
  });

  it("only claims skills found in the resume", () => {
    expect(letter).toContain("My experience with Figma and Design systems");
    expect(letter).not.toContain("SQL");
  });

  it("links the portfolio without https and signs with your name", () => {
    expect(letter).toContain("my work at Nikfox.design.");
    expect(letter.endsWith("Sincerely,\nNik Fox")).toBe(true);
  });

  it("backs the claim with the resume bullet that matches the job", () => {
    expect(letter).toContain("For example, I built the Figma component library used by 6 teams.");
  });

  it("never leaves blanks, even with an empty profile", () => {
    expect(findPlaceholders(letter)).toEqual([]);
    const bare = coverLetterTemplate(job, { full_name: null, headline: null, portfolio_url: null, resume_text: null });
    expect(findPlaceholders(bare)).toEqual([]);
    expect(bare).not.toContain("I'm a");
    expect(bare.endsWith("Sincerely,")).toBe(true);
  });

  it("uses 'an' before a vowel", () => {
    expect(coverLetterTemplate(job, { ...profile, headline: "Interaction Designer" })).toContain("I'm an Interaction Designer");
  });
});

describe("matchedSkills", () => {
  it("is case-insensitive and keeps the job's order", () => {
    expect(matchedSkills({ ...job, tags: ["design systems", "figma"] }, profile)).toEqual(["design systems", "figma"]);
  });
});

describe("parseResume", () => {
  const text = `Nik Fox
nik@example.com · 555 0100

SUMMARY
Product designer with 8 years of experience.

Experience:
Senior Designer, Acme — 2020–2024
- Led the design system
• Shipped onboarding

## Education
BFA, Design School`;

  it("drops contact lines, finds headings, bullets and text", () => {
    const blocks = parseResume(text, ["Nik Fox", "nik@example.com"]);
    expect(blocks).toEqual([
      { type: "heading", lines: ["SUMMARY"] },
      { type: "text", lines: ["Product designer with 8 years of experience."] },
      { type: "heading", lines: ["Experience"] },
      { type: "text", lines: ["Senior Designer, Acme — 2020–2024"] },
      { type: "bullets", lines: ["Led the design system", "Shipped onboarding"] },
      { type: "heading", lines: ["Education"] },
      { type: "text", lines: ["BFA, Design School"] },
    ]);
  });

  it("does not treat a short all-caps acronym line as a heading", () => {
    expect(parseResume("UX\nFigma, Sketch")[0].type).toBe("text");
  });
});

describe("displayUrl", () => {
  it.each([
    ["https://www.nikfox.design/", "nikfox.design"],
    ["http://linkedin.com/in/nik", "linkedin.com/in/nik"],
    [null, ""],
  ])("%s", (url, out) => expect(displayUrl(url)).toBe(out));
});
