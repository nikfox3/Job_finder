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
| Applications | Kanban board: Saved, Applying, Applied, Interview, Offer, Closed |
| Profile | Your details and resume, reused to prefill applications |
| Settings | Auto-submit toggle (off by default), search keywords, remote only, hide account-required jobs, job sources, company watchlist |

## Roadmap

1. App shell, local database, settings ✅
2. Remote design job feeds and LinkedIn / Indeed link import ✅
3. Apply flow: prefilled answers, tailored cover letters, optional auto-submit
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
| Arbeitnow | Mostly European roles (off by default) |
| Company watchlist | Any company hiring through Greenhouse, Lever or Ashby. Add their careers link in Settings |

LinkedIn, Indeed, Wellfound and Dribbble don't offer public feeds, so use **Add from link** on the Jobs page. If the site won't share the details, you can fill in the title and company yourself.

To preview the layout with made-up listings: start the app once, then run `npm run seed:sample` (and `npm run seed:sample -- --clear` to remove them).

## Development

```bash
npm test        # parser and refresh tests (no network needed)
npm run lint
```

## Data

Set `CAREER_OPS_DATA_DIR` to keep the database somewhere other than `./data`.
