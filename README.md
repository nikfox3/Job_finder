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
| Jobs | Job feed (remote boards coming next) |
| Applications | Kanban board: Saved, Applying, Applied, Interview, Offer, Closed |
| Profile | Your details and resume, reused to prefill applications |
| Settings | Auto-submit toggle (off by default), search keywords, remote only, job sources |

## Roadmap

1. App shell, local database, settings ✅
2. Remote design job feeds (Remotive, Remote OK, We Work Remotely, Himalayas) and LinkedIn / Indeed link import
3. Apply flow: prefilled answers, tailored cover letters, optional auto-submit
4. Polish: stats, follow-up reminders, optional AI fit score

## Data

Set `CAREER_OPS_DATA_DIR` to keep the database somewhere other than `./data`.
