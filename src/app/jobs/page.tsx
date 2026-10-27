import Link from "next/link";
import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobListItem } from "@/components/jobs/job-list-item";
import { JobDetail } from "@/components/jobs/job-detail";
import { getSettings } from "@/lib/settings";
import { getJob, listJobs, listJobSources, type JobFilters as Filters } from "@/lib/jobs";
import { getProfile } from "@/lib/profile";
import { scoreFit } from "@/lib/fit";
import { applyMethod } from "@/lib/apply-method";
import { lastRefresh } from "@/lib/ingest";
import { timeAgoPrecise } from "@/lib/format";
import { RefreshButton } from "@/components/jobs/refresh-button";
import { AddJob } from "@/components/jobs/add-job";
import type { Job } from "@/lib/jobs";
import { countryByCode, eligibility } from "@/lib/geo";

// The same role is often posted on several boards; keep the newest copy.
function dedupe(jobs: Job[]) {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.company}|${j.title}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const settings = getSettings();
  const filters: Filters = {
    q: params.q,
    source: params.source,
    remote: settings.remoteOnly,
    minSalary: params.salary ? Number(params.salary) : undefined,
    posted: params.posted as Filters["posted"],
  };
  const profile = getProfile();
  const fitFor = (job: Parameters<typeof scoreFit>[0]) => scoreFit(job, profile, settings);
  // The URL can override the saved preference either way.
  const hideAccount = params.account ? params.account === "none" : settings.hideAccountRequired;
  const home = settings.homeCountry;
  // The URL can override the saved preference either way.
  const scope = home ? (params.where ?? settings.locationScope) : "all";
  const jobs = dedupe(listJobs(filters))
    // Closed postings stay visible only if they're on your board.
    .filter((job) => !job.closed_at || job.status)
    .filter((job) => !hideAccount || applyMethod(job.apply_url ?? job.url, job.apply_account).kind !== "account")
    .map((job) => ({ job, fit: fitFor(job), where: home ? eligibility(job.location, home, job.description) : null }))
    .filter(({ where }) => {
      if (!where || scope === "all") return true;
      // "home" keeps jobs that name your country, e.g. "US only" or "Remote - US".
      return scope === "home" ? where.tier === 0 : where.canApply;
    });
  if (params.sort === "fit") jobs.sort((a, b) => b.fit.score - a.fit.score);
  if (params.sort === "closest") jobs.sort((a, b) => (a.where?.tier ?? 3) - (b.where?.tier ?? 3) || (a.where?.distanceKm ?? 0) - (b.where?.distanceKm ?? 0));
  const selectedJob = (params.job && getJob(Number(params.job))) || jobs[0]?.job || null;

  const hrefFor = (id: number) => {
    const next = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    next.set("job", String(id));
    return `/jobs?${next}`;
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start gap-x-2 gap-y-4">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? "role" : "roles"} matching your search{settings.remoteOnly ? " · remote only" : ""}
            {!home && (
              <>
                {" · "}
                <Link href="/settings" className="text-primary hover:underline">
                  Set where you live
                </Link>{" "}
                to hide jobs you can&apos;t take
              </>
            )}
          </p>
        </div>
        <RefreshButton updated={timeAgoPrecise(lastRefresh())} />
        <AddJob />
      </div>
      <Suspense>
        <JobFilters sources={listJobSources()} hideAccountDefault={settings.hideAccountRequired} homeName={countryByCode(home)?.name ?? null} scopeDefault={settings.locationScope} />
      </Suspense>
      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={lastRefresh() ? "Try a different search, or widen your filters." : "Press Refresh to pull in jobs from your sources."}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-1">
            {jobs.map(({ job, fit, where }) => (
              <JobListItem key={job.id} job={job} fit={fit} where={where} href={hrefFor(job.id)} active={job.id === selectedJob?.id} />
            ))}
          </div>
          {selectedJob && (
            // Keyed by job so switching jobs starts the panel at the top.
            <div key={selectedJob.id} className="hidden lg:block lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-xl">
              <JobDetail homeCountry={home} job={selectedJob} fit={fitFor(selectedJob)} where={home ? eligibility(selectedJob.location, home, selectedJob.description) : null} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
