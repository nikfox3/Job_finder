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
  const jobs = dedupe(listJobs(filters))
    .filter((job) => !hideAccount || applyMethod(job.apply_url ?? job.url, job.apply_account).kind !== "account")
    .map((job) => ({ job, fit: fitFor(job) }));
  if (params.sort === "fit") jobs.sort((a, b) => b.fit.score - a.fit.score);
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
          </p>
        </div>
        <RefreshButton updated={timeAgoPrecise(lastRefresh())} />
        <AddJob />
      </div>
      <Suspense>
        <JobFilters sources={listJobSources()} hideAccountDefault={settings.hideAccountRequired} />
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
            {jobs.map(({ job, fit }) => (
              <JobListItem key={job.id} job={job} fit={fit} href={hrefFor(job.id)} active={job.id === selectedJob?.id} />
            ))}
          </div>
          {selectedJob && (
            <div className="hidden lg:sticky lg:top-8 lg:block lg:h-[calc(100vh-13rem)]">
              <JobDetail job={selectedJob} fit={fitFor(selectedJob)} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
