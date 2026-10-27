import { describe, expect, it } from "vitest";
import { parseTheMuse } from "@/lib/sources/themuse";
import { parseFourDayWeek } from "@/lib/sources/fourdayweek";
import { parseJobspresso, parseNoDesk } from "@/lib/sources/rss-boards";
import { parseBreezy, parseCareersUrl, parseRecruitee, parseSmartRecruiters, parseWorkable } from "@/lib/sources/companies";

const company = { ats: "workable", slug: "acme", name: "Acme" } as const;

describe("board parsers", () => {
  it("The Muse", () => {
    const [job] = parseTheMuse({
      results: [
        {
          id: 7,
          name: "Senior Product Designer",
          contents: "<p>Design</p>",
          publication_date: "2026-10-20T00:00:00Z",
          locations: [{ name: "Flexible / Remote" }],
          levels: [{ name: "Senior Level" }],
          categories: [{ name: "Design and UX" }],
          company: { name: "Muse Co" },
          refs: { landing_page: "https://www.themuse.com/jobs/museco/senior-product-designer" },
        },
      ],
    });
    expect(job).toMatchObject({ externalId: "7", company: "Muse Co", remote: true, seniority: "Senior", tags: ["Design and UX"] });
  });

  it("4 Day Week skips expired jobs and builds the URL from the slug", () => {
    const jobs = parseFourDayWeek({
      jobs: [
        { slug: "ux-designer-acme", title: "UX Designer", company_name: "Acme", posted: 1761000000, work_arrangement: "remote", locations: [{ country: "United States" }] },
        { slug: "old", title: "Old", is_expired: true },
        { slug: "bad/slug", title: "Bad" },
      ],
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ url: "https://4dayweek.io/job/ux-designer-acme", location: "United States, Remote", remote: true });
  });

  it("NoDesk splits 'Role at Company'", () => {
    const [job] = parseNoDesk(`<rss><channel><item><title>Product Designer at Data at Scale</title><link>https://nodesk.co/remote-jobs/x/</link><pubDate>Mon, 20 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`);
    expect(job).toMatchObject({ title: "Product Designer at Data", company: "Scale", remote: true });
  });

  it("Jobspresso reads the job_listing tags", () => {
    const [job] = parseJobspresso(
      `<rss><channel><item><title>UI Designer</title><link>https://jobspresso.co/job/ui/</link><guid>j-1</guid><job_listing:company>Acme</job_listing:company><job_listing:location>USA Only</job_listing:location></item></channel></rss>`,
    );
    expect(job).toMatchObject({ externalId: "j-1", company: "Acme", location: "USA Only" });
  });
});

describe("company boards", () => {
  it("Workable folds one posting listed per country", () => {
    const jobs = parseWorkable(
      {
        jobs: [
          { title: "Product Designer", shortcode: "AB1", shortlink: "https://apply.workable.com/j/AB1", city: "London", country: "United Kingdom", telecommuting: true },
          { title: "Product Designer", shortcode: "AB1", shortlink: "https://apply.workable.com/j/AB1", country: "Poland", telecommuting: true },
        ],
      },
      company,
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].location).toBe("London, United Kingdom · Poland, Remote");
  });

  it("SmartRecruiters links to the public job page", () => {
    const [job] = parseSmartRecruiters(
      { content: [{ id: "744", name: "UX Designer II", releasedDate: "2026-10-01T00:00:00Z", location: { city: "Austin", region: "TX", country: "us", remote: true }, experienceLevel: { label: "Mid-Senior Level" } }] },
      company,
    );
    expect(job).toMatchObject({ url: "https://jobs.smartrecruiters.com/acme/744-ux-designer-ii", location: "Austin, TX, us, Remote", remote: true });
  });

  it("Recruitee joins description and requirements and reads salary", () => {
    const [job] = parseRecruitee(
      { offers: [{ id: 3, title: "Designer", careers_url: "https://acme.recruitee.com/o/designer", location: "Remote, US", remote: true, description: "<p>A</p>", requirements: "<p>B</p>", salary: { min: "90000", max: "120000", currency: "USD" } }] },
      company,
    );
    expect(job).toMatchObject({ description: "<p>A</p><p>B</p>", salaryMin: 90000, salaryMax: 120000, location: "Remote, US" });
  });

  it("Breezy adds the country to short location names", () => {
    const [job] = parseBreezy([{ id: "x1", name: "Brand Designer", url: "https://acme.breezy.hr/p/x1", location: { name: "Seattle, WA", country: { name: "United States" }, is_remote: false } }], company);
    expect(job.location).toBe("Seattle, WA, United States");
  });

  it.each([
    ["https://apply.workable.com/acme/", { ats: "workable", slug: "acme" }],
    ["careers.smartrecruiters.com/Acme1", { ats: "smartrecruiters", slug: "Acme1" }],
    ["https://jobs.smartrecruiters.com/acme/744-ux", { ats: "smartrecruiters", slug: "acme" }],
    ["https://acme.recruitee.com/o/designer", { ats: "recruitee", slug: "acme" }],
    ["acme.breezy.hr", { ats: "breezy", slug: "acme" }],
    ["https://www.breezy.hr", null],
  ])("parses %s", (url, expected) => expect(parseCareersUrl(url)).toEqual(expected));
});
