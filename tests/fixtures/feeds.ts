// Small, hand-written examples in the shape each public API documents.
export const remotive = {
  "job-count": 2,
  jobs: [
    {
      id: 1901,
      url: "https://remotive.com/remote-jobs/design/senior-product-designer-1901",
      title: "Senior Product Designer",
      company_name: "Acme",
      category: "Design",
      tags: ["figma", "design systems"],
      job_type: "full_time",
      publication_date: "2026-10-20T10:00:00",
      candidate_required_location: "USA",
      salary: "$120k - $150k",
      description: "<p>Design things.</p><script>alert(1)</script>",
    },
    {
      id: 1902,
      url: "https://remotive.com/remote-jobs/design/brand-designer-1902",
      title: "Brand Designer",
      company_name: "Beta",
      tags: [],
      job_type: "contract",
      publication_date: "2026-10-21T10:00:00",
      candidate_required_location: "Worldwide",
      salary: "",
      description: "<p>Brand work.</p>",
    },
  ],
};

export const remoteok = [
  { legal: "API Terms of Service: please link back to Remote OK." },
  {
    id: "123",
    slug: "remote-ux-designer-gamma-123",
    epoch: 1792000000,
    date: "2026-10-22T08:00:00+00:00",
    company: "Gamma",
    position: "UX Designer",
    tags: ["design", "ux"],
    description: "<p>UX role</p>",
    location: "Europe",
    salary_min: 80000,
    salary_max: 100000,
    apply_url: "https://jobs.lever.co/gamma/abc",
    url: "https://remoteok.com/remote-jobs/remote-ux-designer-gamma-123",
  },
  {
    id: "124",
    slug: "backend-engineer-124",
    date: "2026-10-22T08:00:00+00:00",
    company: "Delta",
    position: "Backend Engineer",
    tags: ["go"],
    url: "https://remoteok.com/remote-jobs/124",
  },
];

export const weworkremotely = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>We Work Remotely: Design Jobs</title>
<item>
  <title>Epsilon Inc: Product Designer</title>
  <region>Anywhere in the World</region>
  <category>Design</category>
  <type>Full-Time</type>
  <description>&lt;p&gt;Join &amp;amp; design&lt;/p&gt;</description>
  <pubDate>Wed, 22 Oct 2026 12:00:00 +0000</pubDate>
  <guid>https://weworkremotely.com/remote-jobs/epsilon-product-designer</guid>
  <link>https://weworkremotely.com/remote-jobs/epsilon-product-designer</link>
</item>
</channel></rss>`;

export const himalayas = {
  totalCount: 1,
  jobs: [
    {
      guid: "https://himalayas.app/companies/zeta/jobs/ui-designer",
      title: "UI Designer",
      excerpt: "Zeta makes payroll simple for remote teams.",
      companyName: "Zeta",
      companySlug: "zeta",
      employmentType: "Full Time",
      minSalary: 90000,
      maxSalary: 110000,
      currency: "USD",
      seniority: ["Mid-level"],
      locationRestrictions: ["United States", "Canada"],
      timezoneRestrictions: [-8, -5],
      categories: ["UI-Design", "Product-Design"],
      description: "<p>Pixels.</p>",
      pubDate: 1792500000,
      applicationLink: "https://boards.greenhouse.io/zeta/jobs/42",
    },
  ],
};

export const jobicy = {
  jobs: [
    {
      id: 77,
      url: "https://jobicy.com/jobs/77-product-designer",
      jobTitle: "Product Designer &amp; Researcher",
      companyName: "Eta",
      jobIndustry: ["Design &amp; Multimedia"],
      jobType: ["Full-Time"],
      jobGeo: "EMEA",
      jobLevel: "Senior",
      jobDescription: "<p>Research and design.</p>",
      pubDate: "2026-10-23 09:00:00",
      annualSalaryMin: "70000",
      annualSalaryMax: "90000",
      salaryCurrency: "EUR",
    },
  ],
};

export const workingnomads = [
  {
    url: "https://www.workingnomads.com/jobs/product-designer-theta",
    title: "Product Designer",
    description: "<p>Theta</p>",
    company_name: "Theta",
    category_name: "Design",
    tags: "figma,prototyping",
    location: "Anywhere",
    pub_date: "2026-10-24T00:00:00",
  },
  {
    url: "https://www.workingnomads.com/jobs/sales-iota",
    title: "Account Executive",
    company_name: "Iota",
    category_name: "Sales",
    tags: "",
    location: "USA",
    pub_date: "2026-10-24T00:00:00",
  },
];

export const greenhouse = {
  jobs: [
    {
      id: 5001,
      title: "Senior Product Designer",
      first_published: "2026-10-18T00:00:00-04:00",
      location: { name: "Remote - US" },
      absolute_url: "https://boards.greenhouse.io/kappa/jobs/5001",
      content: "&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;",
      departments: [{ name: "Design" }],
    },
    {
      id: 5002,
      title: "Staff Software Engineer",
      location: { name: "New York" },
      absolute_url: "https://boards.greenhouse.io/kappa/jobs/5002",
    },
  ],
};

export const lever = [
  {
    id: "lv1",
    text: "Product Designer",
    hostedUrl: "https://jobs.lever.co/lambda/lv1",
    applyUrl: "https://jobs.lever.co/lambda/lv1/apply",
    createdAt: 1792000000000,
    workplaceType: "remote",
    categories: { location: "Berlin", team: "Design", commitment: "Full-time" },
    description: "<div>About</div>",
    lists: [{ text: "You will", content: "<li>Design</li>" }],
    salaryRange: { min: 60000, max: 80000, currency: "EUR", interval: "per-year-salary" },
  },
];

export const ashby = {
  jobs: [
    {
      id: "as1",
      title: "Lead Product Designer",
      location: "Remote",
      department: "Design",
      isRemote: true,
      descriptionHtml: "<p>Lead</p>",
      publishedAt: "2026-10-19T00:00:00.000Z",
      employmentType: "FullTime",
      jobUrl: "https://jobs.ashbyhq.com/mu/as1",
      applyUrl: "https://jobs.ashbyhq.com/mu/as1/application",
      compensation: { summaryComponents: [{ compensationType: "Salary", interval: "1 YEAR", minValue: 150000, maxValue: 180000, currencyCode: "USD" }] },
    },
  ],
};

export const linkedinPage = `<html><head><title>Product Designer | Nu | LinkedIn</title>
<script type="application/ld+json">{"@context":"http://schema.org","@type":"JobPosting","title":"Product Designer","datePosted":"2026-10-20T12:00:00.000Z","description":"&lt;p&gt;Design at Nu&lt;/p&gt;","employmentType":"FULL_TIME","hiringOrganization":{"@type":"Organization","name":"Nu","sameAs":"https://nu.example"},"jobLocationType":"TELECOMMUTE","jobLocation":{"@type":"Place","address":{"@type":"PostalAddress","addressLocality":"Austin","addressRegion":"TX","addressCountry":"US"}},"baseSalary":{"@type":"MonetaryAmount","currency":"USD","value":{"@type":"QuantitativeValue","minValue":100000,"maxValue":130000,"unitText":"YEAR"}}}</script>
</head><body></body></html>`;
