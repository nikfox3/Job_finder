import { describe, expect, it } from "vitest";
import { parseBuiltIn } from "@/lib/sources/builtin";
import { parseHnComment, parseHnThread } from "@/lib/sources/hackernews";
import { parseWttjEnv, parseWttjHits } from "@/lib/sources/wttj";

describe("Built In", () => {
  const html = `
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"ListItem","position":1,"name":"Senior Product Designer","url":"https://builtin.com/job/senior-product-designer/4412345","description":"Design \\"great\\" things"}]}</script>
    <div><a href="/company/acme-co" data-id="company-title"><span>Acme Co</span></a>
    <h2><a data-id="job-card-title" data-builtin-track-job-id="4412345" href="/job/senior-product-designer/4412345">Senior Product Designer</a></h2>
    <div><i class="fa-regular fa-house-building"></i><span>Remote</span></div>
    <div><i class="fa-regular fa-location-dot"></i><span>Austin, TX, USA</span></div>
    <div><i class="fa-regular fa-sack-dollar"></i><span>140K-175K Annually</span></div></div>`;

  it("joins the ItemList with the job card", () => {
    expect(parseBuiltIn(html)).toEqual([
      expect.objectContaining({
        externalId: "4412345",
        title: "Senior Product Designer",
        company: "Acme Co",
        location: "Austin, TX, USA · Remote",
        remote: true,
        salaryMin: 140000,
        salaryMax: 175000,
        description: 'Design "great" things',
      }),
    ]);
  });
});

describe("Hacker News", () => {
  it("reads the Company | Role | Location header", () => {
    const job = parseHnComment({
      id: 4242,
      created_at: "2026-10-01T15:00:00Z",
      text: "Acme | Senior Product Designer | REMOTE (US) | Full-time<p>We build things. Apply: <a href=\"https:&#x2F;&#x2F;jobs.lever.co&#x2F;acme&#x2F;123\">https:&#x2F;&#x2F;jobs.lever.co&#x2F;acme&#x2F;123</a>",
    })!;
    expect(job).toMatchObject({
      company: "Acme",
      title: "Senior Product Designer",
      location: "REMOTE (US)",
      remote: true,
      url: "https://news.ycombinator.com/item?id=4242",
      applyUrl: "https://jobs.lever.co/acme/123",
    });
  });

  it("skips replies that aren't job posts", () => {
    expect(parseHnThread({ children: [{ id: 1, text: "Is this remote?" }, { id: 2, text: null }] })).toEqual([]);
  });
});

describe("Welcome to the Jungle", () => {
  it("reads the Algolia credentials from /api/env", () => {
    expect(parseWttjEnv('window.env = {"PUBLIC_ALGOLIA_APPLICATION_ID":"CSEKHVMS53","PUBLIC_ALGOLIA_API_KEY_CLIENT":"0123456789abcdef0123"}')).toEqual({
      appId: "CSEKHVMS53",
      apiKey: "0123456789abcdef0123",
    });
    expect(() => parseWttjEnv('{"PUBLIC_ALGOLIA_APPLICATION_ID":"x"}')).toThrow();
  });

  it("maps hits to jobs", () => {
    const [job] = parseWttjHits({
      hits: [
        {
          name: "Product Designer",
          slug: "product-designer_paris",
          organization: { name: "Acme", slug: "acme" },
          offices: [{ city: "New York", country: "United States" }],
          remote: "fulltime",
          published_at_timestamp: 1761000000,
          salary_yearly_minimum: 120000,
          salary_maximum: 150000,
          salary_currency: "USD",
        },
        { name: "Bad", slug: "../x", organization: { slug: "acme" } },
      ],
    });
    expect(job).toMatchObject({
      url: "https://www.welcometothejungle.com/en/companies/acme/jobs/product-designer_paris",
      location: "New York, United States, Remote",
      remote: true,
      salaryMin: 120000,
    });
  });
});
