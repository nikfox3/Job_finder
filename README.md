# Career Ops

A modern, local-only dashboard for your job search: browse remote job postings, keep your profile and resume in one place, and track every application from saved to offer.

Everything is stored in a single SQLite file (`data/career-ops.db`) on your machine. Nothing is sent anywhere.

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a faster, production build:

```bash
npm run build
npm start
```

## What's here

| Page | What it does |
| --- | --- |
| Overview | Stats and a getting-started checklist |
| Jobs | Remote design jobs from several boards, with search, filters, a fit score and "account required" tags. Add LinkedIn, Indeed or any other job by pasting its link |
| Apply kit | Opens from any job. Your details and saved answers ready to copy, plus a cover letter and resume for that job you can edit and save as a PDF |
| Applications | Kanban board: Saved, Applying, Applied, Interview, Offer, Closed |
| Profile | Your details, resume and answer bank (work authorization, salary, start date and so on), reused in every apply kit |
| Settings | Auto-submit toggle (off by default), search keywords, remote only, hide account-required jobs, job sources, company watchlist, optional Anthropic API key |

## Roadmap

1. App shell, local database, settings ✅
2. Remote design job feeds and LinkedIn / Indeed link import ✅
3. Apply kit: answer bank, cover letters, printable resumes, optional AI writing ✅
4. Polish: stats, follow-up reminders, optional AI fit score

## Job sources

Jobs refresh when the app starts and every 3 hours while it runs, or when you press **Refresh**.

| Source | What it covers |
| --- | --- |
| Remotive | Remote design category (fetched at most 4 times a day, as Remotive asks) |
| Remote OK | Remote jobs tagged design |
| We Work Remotely | Remote design category RSS |
| Himalayas | Remote jobs matching your keywords, with timezone and company info |
| Jobicy | Remote design & multimedia category |
| Working Nomads | Remote design category |
| The Muse | Design & UX roles that are remote or flexible |
| 4 Day Week | Jobs with a 4-day or 32-hour week, filtered to design roles |
| NoDesk | Curated remote jobs, filtered to design roles |
| Jobspresso | Hand-screened remote jobs, filtered to design roles |
| Arbeitnow | Mostly European roles (off by default) |
| Company watchlist | Any company hiring through Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee or Breezy. Add their careers link in Settings |

### Closed and stale postings

Postings that come down from a watched company's careers page are marked closed and hidden. Each refresh also re-opens a few week-old postings (at most once a day each, jobs on your board first) and marks them closed if the page is gone or says the role is filled. Closed jobs on your board stay visible with a "Posting closed" tag. Postings over a month old are tagged, since they're often already filled or ghost jobs.

LinkedIn, Indeed, Wellfound and Dribbble don't offer public feeds, so use **Add from link** on the Jobs page. If the site won't share the details, you can fill in the title and company yourself.

To preview the layout with made-up listings: start the app once, then run `npm run seed:sample` (and `npm run seed:sample -- --clear` to remove them).

## Development

```bash
npm test        # parser and refresh tests (no network needed)
npm run lint
```

## AI writing (optional)

Everything works without AI: cover letters start from a short template with [bracketed] notes for you to fill in, and the resume starts as a copy of the one on your Profile.

To have Claude draft a tailored cover letter or resume for each job, add an Anthropic API key in Settings (or set `ANTHROPIC_API_KEY`). The key is stored only in your local database. Drafts use only facts from your resume and profile, and each one costs a few cents. If the model declines a request, the API retries it on a fallback model automatically.

## Data

Set `CAREER_OPS_DATA_DIR` to keep the database somewhere other than `./data`.
