import Link from "next/link";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSalary, sourceName, timeAgo } from "@/lib/format";
import type { Job } from "@/lib/jobs";
import type { Fit } from "@/lib/fit";
import { CompanyLogo } from "./company-logo";
import { FitBadge } from "./fit-badge";
import { ApplyMethodBadge } from "./apply-method-badge";
import { applyMethod } from "@/lib/apply-method";
import type { Eligibility } from "@/lib/geo";
import { LocationBadge } from "./location-badge";
import { FreshnessBadge } from "./freshness-badge";
import { freshness } from "@/lib/freshness";

export function JobListItem({ job, fit, where, href, active }: { job: Job; fit: Fit; where: Eligibility | null; href: string; active: boolean }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "group flex gap-3 rounded-xl border p-4 transition-colors",
        active ? "border-primary/60 bg-accent/40" : "bg-card hover:border-foreground/20",
      )}
    >
      <CompanyLogo name={job.company} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{job.title}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {job.company} · {job.remote ? "Remote" : job.location}
              {job.remote && job.location ? ` (${job.location})` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {job.status && <Bookmark className="size-4 shrink-0 fill-primary text-primary" />}
            <FitBadge score={fit.score} size={36} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {salary && <span className="font-medium text-success">{salary}</span>}
          {job.employment_type && <span>{job.employment_type}</span>}
          {job.seniority && <span>{job.seniority}</span>}
          {where && <LocationBadge eligibility={where} />}
          <ApplyMethodBadge method={applyMethod(job.apply_url ?? job.url, job.apply_account)} />
          <FreshnessBadge freshness={freshness(job)} />
          <span className="ml-auto">
            {sourceName(job.source)} · {timeAgo(job.posted_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
