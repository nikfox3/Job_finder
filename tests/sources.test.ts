import { describe, expect, it } from "vitest";
import * as f from "./fixtures/feeds";
import { parseRemotive } from "@/lib/sources/remotive";
import { parseRemoteOk } from "@/lib/sources/remoteok";
import { parseWeWorkRemotely } from "@/lib/sources/weworkremotely";
import { parseHimalayas } from "@/lib/sources/himalayas";
import { parseJobicy } from "@/lib/sources/jobicy";
import { parseWorkingNomads } from "@/lib/sources/workingnomads";
import { parseAshby, parseCareersUrl, parseGreenhouse, parseLever } from "@/lib/sources/companies";
import { isRelevant, parseSalaryText } from "@/lib/sources/util";
import { parseJobPage, sourceFromUrl } from "@/lib/import";
import { applyMethod } from "@/lib/apply-method";

describe("board parsers", () => {
  it("Remotive", () => {
    const [a, b] = parseRemotive(f.remotive);
    expect(a).toMatchObject({ externalId: "1901", title: "Senior Product Designer", company: "Acme", salaryMin: 120000, salaryMax: 150000, currency: "USD", employmentType: "Full-time", seniority: "Senior", remote: true });
    expect(b).toMatchObject({ employmentType: "Contract", salaryMin: null, timezone: "Any" });
  });

  it("Remote OK skips the legal notice", () => {
    const jobs = parseRemoteOk(f.remoteok);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ title: "UX Designer", company: "Gamma", applyUrl: "https://jobs.lever.co/gamma/abc", salaryMin: 80000 });
  });

  it("We Work Remotely splits company from title", () => {
    const [job] = parseWeWorkRemotely(f.weworkremotely);
    expect(job).toMatchObject({ company: "Epsilon Inc", title: "Product Designer", location: "Anywhere in the World", employmentType: "Full-time" });
    expect(job.description).toBe("<p>Join &amp; design</p>");
    expect(job.postedAt).toBe("2026-10-22T12:00:00.000Z");
  });

  it("Himalayas", () => {
    const [job] = parseHimalayas(f.himalayas);
    expect(job).toMatchObject({ company: "Zeta", timezone: "UTC-8 to UTC-5", location: "United States, Canada", seniority: "Mid-level", companyDescription: "Zeta makes payroll simple for remote teams." });
    expect(job.tags).toEqual(["UI Design", "Product Design"]);
  });

  it("Jobicy decodes entities", () => {
    const [job] = parseJobicy(f.jobicy);
    expect(job).toMatchObject({ title: "Product Designer & Researcher", salaryMin: 70000, currency: "EUR", seniority: "Senior", tags: ["Design & Multimedia"] });
    expect(job.postedAt).toBe("2026-10-23T09:00:00.000Z");
  });

  it("Working Nomads keeps design only", () => {
    const jobs = parseWorkingNomads(f.workingnomads);
    expect(jobs.map((j) => j.company)).toEqual(["Theta"]);
    expect(jobs[0].tags).toEqual(["figma", "prototyping"]);
  });
});

describe("company boards", () => {
  const co = (ats: "greenhouse" | "lever" | "ashby", slug: string) => ({ ats, slug, name: slug.toUpperCase() });

  it("Greenhouse unescapes content and detects remote", () => {
    const [a, b] = parseGreenhouse(f.greenhouse, co("greenhouse", "kappa"));
    expect(a).toMatchObject({ remote: true, description: "<p>Hello &amp; welcome</p>", company: "KAPPA", tags: ["Design"] });
    expect(b.remote).toBe(false);
  });

  it("Lever", () => {
    const [job] = parseLever(f.lever, co("lever", "lambda"));
    expect(job).toMatchObject({ remote: true, salaryMin: 60000, currency: "EUR", employmentType: "Full-time", applyUrl: "https://jobs.lever.co/lambda/lv1/apply" });
    expect(job.description).toContain("<h3>You will</h3>");
  });

  it("Ashby", () => {
    const [job] = parseAshby(f.ashby, co("ashby", "mu"));
    expect(job).toMatchObject({ remote: true, salaryMin: 150000, salaryMax: 180000, seniority: "Lead", employmentType: "Full-time" });
  });

  it("reads careers links", () => {
    expect(parseCareersUrl("https://boards.greenhouse.io/figma")).toEqual({ ats: "greenhouse", slug: "figma" });
    expect(parseCareersUrl("job-boards.greenhouse.io/notion/jobs/123")).toEqual({ ats: "greenhouse", slug: "notion" });
    expect(parseCareersUrl("https://boards.greenhouse.io/embed/job_board?for=airbnb")).toEqual({ ats: "greenhouse", slug: "airbnb" });
    expect(parseCareersUrl("https://jobs.lever.co/acme/abc-123")).toEqual({ ats: "lever", slug: "acme" });
    expect(parseCareersUrl("jobs.ashbyhq.com/linear")).toEqual({ ats: "ashby", slug: "linear" });
    expect(parseCareersUrl("https://example.com/careers")).toBeNull();
  });
});

describe("helpers", () => {
  it("parses salary text", () => {
    expect(parseSalaryText("$90k - $120k")).toEqual({ min: 90000, max: 120000, currency: "USD" });
    expect(parseSalaryText("€60,000–70,000 per year")).toEqual({ min: 60000, max: 70000, currency: "EUR" });
    expect(parseSalaryText("Competitive")).toEqual({ min: null, max: null, currency: null });
  });

  it("filters relevant titles", () => {
    expect(isRelevant("Senior UX Researcher", [])).toBe(true);
    expect(isRelevant("Backend Engineer", ["product designer"])).toBe(false);
    expect(isRelevant("Creative Director", ["creative director"])).toBe(true);
  });

  it("uses the apply page check when the link is unknown", () => {
    expect(applyMethod("https://acme.com/careers/1")).toEqual({ kind: "unknown", platform: null });
    expect(applyMethod("https://acme.com/careers/1", "account").kind).toBe("account");
    expect(applyMethod("https://boards.greenhouse.io/acme/jobs/1", "account").kind).toBe("no-account");
  });
});

describe("link import", () => {
  it("reads JobPosting data", () => {
    const job = parseJobPage(f.linkedinPage, "https://www.linkedin.com/jobs/view/1");
    expect(job).toMatchObject({ title: "Product Designer", company: "Nu", remote: true, salaryMin: 100000, salaryMax: 130000, currency: "USD", employmentType: "Full-time", location: "Austin, TX, US" });
    expect(job.description).toBe("<p>Design at Nu</p>");
    expect(sourceFromUrl("https://www.linkedin.com/jobs/view/1")).toBe("linkedin");
  });

  it("falls back to page meta", () => {
    const job = parseJobPage(`<meta property="og:title" content="Designer at Xi"><title>x</title>`, "https://xi.example/job");
    expect(job.title).toBe("Designer at Xi");
    expect(job.company).toBeUndefined();
  });
});
