import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobListItem } from "@/components/jobs/job-list-item";
import { JobDetail } from "@/components/jobs/job-detail";
import { getSettings } from "@/lib/settings";
import { getJob, listJobs, listJobSources, type JobFilters as Filters } from "@/lib/jobs";

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
  const jobs = listJobs(filters);
  const selected = (params.job && getJob(Number(params.job))) || jobs[0] || null;

  const hrefFor = (id: number) => {
    const next = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    next.set("job", String(id));
    return `/jobs?${next}`;
  };

  return (
    <>
      <PageHeader
        title="Jobs"
        description={`${jobs.length} ${jobs.length === 1 ? "role" : "roles"} matching your search${settings.remoteOnly ? " · remote only" : ""}`}
      />
      <Suspense>
        <JobFilters sources={listJobSources()} />
      </Suspense>
      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found" description="Try a different search, or widen your filters." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-1">
            {jobs.map((job) => (
              <JobListItem key={job.id} job={job} href={hrefFor(job.id)} active={job.id === selected?.id} />
            ))}
          </div>
          {selected && (
            <div className="hidden lg:sticky lg:top-8 lg:block lg:h-[calc(100vh-13rem)]">
              <JobDetail job={selected} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
