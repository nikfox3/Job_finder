// Adds made-up sample listings so you can preview the Jobs page before real feeds exist.
// Usage: npm run seed:sample          (add samples)
//        npm run seed:sample -- --clear (remove them)
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = path.join(process.env.CAREER_OPS_DATA_DIR ?? path.join(process.cwd(), "data"), "career-ops.db");
if (!fs.existsSync(dbPath)) {
  console.error("No database yet. Start the app once with `npm run dev`, then run this again.");
  process.exit(1);
}
const db = new Database(dbPath);
if (db.pragma("user_version", { simple: true }) < 3) {
  console.error("Database is out of date. Start the app once with `npm run dev`, then run this again.");
  process.exit(1);
}

db.prepare("DELETE FROM jobs WHERE source = 'sample'").run();
if (process.argv.includes("--clear")) {
  console.log("Removed sample jobs.");
  process.exit(0);
}

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 19).replace("T", " ");

const description = (company, focus) => `${company} is a fully remote team building ${focus}. We're looking for a designer who loves turning messy problems into simple, delightful experiences.

## What you'll do

- Own end-to-end design for a core product area, from discovery to shipped UI
- Run lightweight research with customers and turn insights into clear direction
- Partner closely with engineering and product in a small, async-first team
- Contribute to and evolve our design system

## What we're looking for

- 4+ years designing digital products, with a portfolio that shows your process
- Strong interaction and visual design skills in Figma
- Comfort working async across timezones with clear written communication

## Benefits

- Fully remote with a home office stipend
- Flexible hours and 25 days of paid time off
- Annual team retreat`;

const jobs = [
  ["Senior Product Designer", "Northwind Labs", "US or Canada", 140000, 175000, "USD", "Full-time", "Senior", "UTC-8 to UTC-5", ["Figma", "Design systems", "B2B SaaS"], 0, "collaborative analytics tools", "Analytics", "51-200"],
  ["UX Designer", "Brightloop", "Europe", 70000, 90000, "EUR", "Full-time", "Mid-level", "UTC±0 to UTC+3", ["User research", "Prototyping", "Mobile"], 1, "a habit-tracking app for teams", "Productivity", "11-50"],
  ["Product Designer, Growth", "Canvasly", "Worldwide", 110000, 135000, "USD", "Full-time", "Mid-level", "Any", ["Experimentation", "Onboarding", "Figma"], 2, "a visual collaboration platform", "Design tools", "201-500"],
  ["Lead UI Designer", "Orbital Health", "US", 160000, 190000, "USD", "Full-time", "Lead", "UTC-8 to UTC-5", ["Healthcare", "Accessibility", "Design systems"], 3, "patient-friendly telehealth software", "Healthcare", "501-1000"],
  ["Design Systems Designer", "Fieldnote", "Americas", 125000, 150000, "USD", "Full-time", "Senior", "UTC-8 to UTC-3", ["Tokens", "Components", "Documentation"], 5, "note-taking for research teams", "Research software", "11-50"],
  ["Product Designer (Contract)", "Tidewater", "Worldwide", 85, 110, "USD", "Contract", "Mid-level", "Any", ["Fintech", "Dashboards"], 6, "cash-flow tools for small businesses", "Fintech", "51-200"],
  ["Junior Product Designer", "Pebble & Co", "UK or Europe", 40000, 50000, "GBP", "Full-time", "Junior", "UTC±0 to UTC+2", ["Mentorship", "E-commerce"], 9, "a marketplace for independent makers", "E-commerce", "11-50"],
  ["Staff Product Designer", "Lumen AI", "US or Europe", 185000, 220000, "USD", "Full-time", "Staff", "UTC-5 to UTC+2", ["AI products", "Strategy", "Prototyping"], 14, "AI writing assistants for support teams", "Artificial intelligence", "201-500"],
];

const insert = db.prepare(`
  INSERT INTO jobs (source, external_id, title, company, location, remote, salary_min, salary_max, currency, url,
                    description, tags, posted_at, employment_type, seniority, timezone,
                    company_description, company_industry, company_size, company_website)
  VALUES ('sample', @id, @title, @company, @location, 1, @min, @max, @currency, 'https://example.com/jobs',
          @description, @tags, @posted, @type, @seniority, @tz,
          @about, @industry, @size, 'https://example.com')
`);
db.transaction(() => {
  jobs.forEach(([title, company, location, min, max, currency, type, seniority, tz, tags, age, focus, industry, size], i) =>
    insert.run({ id: `sample-${i}`, title, company, location, min, max, currency, type, seniority, tz,
      tags: JSON.stringify(tags), posted: daysAgo(age), description: description(company, focus),
      about: `${company} builds ${focus}. The team works fully remotely and ships in small, frequent releases.`,
      industry, size }),
  );
})();
console.log(`Added ${jobs.length} sample jobs. Open http://localhost:3000/jobs`);
