import { Briefcase, Building2, Check, Clock, Globe2, MapPin, Users, Wallet, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSalary, sourceName, timeAgo } from "@/lib/format";
import type { Job } from "@/lib/jobs";
import type { Fit } from "@/lib/fit";
import { CompanyLogo } from "./company-logo";
import { FitBadge } from "./fit-badge";
import { ApplyMethodBadge } from "./apply-method-badge";
import { applyMethod } from "@/lib/apply-method";
import type { Eligibility } from "@/lib/geo";
import { LocationBadge } from "./location-badge";
import { JobActions } from "./job-actions";

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function JobDetail({ job, fit, where }: { job: Job; fit: Fit; where: Eligibility | null }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  return (
    <article className="rounded-xl border bg-card">
      <header className="border-b p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo name={job.company} className="size-12 text-base" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{job.title}</h2>
            <p className="mt-0.5 text-muted-foreground">{job.company}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FitBadge score={fit.score} size={52} className="[&>span]:text-sm" />
            <span className="text-xs text-muted-foreground">Fit</span>
          </div>
        </div>
        <JobActions jobId={job.id} status={job.status} applyUrl={job.apply_url ?? job.url} sourceUrl={job.url} sourceName={sourceName(job.source)} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {where && <LocationBadge eligibility={where} />}
          <ApplyMethodBadge method={applyMethod(job.apply_url ?? job.url, job.apply_account)} showPlatform />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 border-b p-6 xl:grid-cols-3">
        <Fact icon={Wallet} label="Salary" value={salary} />
        <Fact icon={MapPin} label="Location" value={job.remote ? `Remote${job.location ? ` · ${job.location}` : ""}` : job.location} />
        <Fact icon={Globe2} label="Timezone" value={job.timezone} />
        <Fact icon={Briefcase} label="Type" value={[job.employment_type, job.seniority].filter(Boolean).join(" · ") || null} />
        <Fact icon={Clock} label="Posted" value={timeAgo(job.posted_at)} />
      </div>

      <div className="p-6">
        <section className="mb-6 rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Why it fits</h3>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {fit.reasons.map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                {r.met ? <Check className="size-4 text-success" /> : <X className="size-4 text-muted-foreground" />}
                <span className={r.met ? "" : "text-muted-foreground"}>{r.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {(job.company_description || job.company_industry || job.company_size) && (
          <section className="mb-6 rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <h3 className="text-sm font-semibold">About {job.company}</h3>
              {job.company_industry && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" /> {job.company_industry}
                </span>
              )}
              {job.company_size && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" /> {job.company_size} employees
                </span>
              )}
              {job.company_website && (
                <a href={job.company_website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Globe2 className="size-3.5" /> Website
                </a>
              )}
            </div>
            {job.company_description && <p className="text-sm leading-relaxed text-muted-foreground">{job.company_description}</p>}
          </section>
        )}

        {job.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {job.tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
        {job.description && /<[a-z][\s\S]*>/i.test(job.description) ? (
          // Sanitized when the job was saved (see cleanDescription in lib/ingest.ts).
          <div className="job-html text-sm leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: job.description }} />
        ) : (
          <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
            {(job.description ?? "").split(/\n{2,}/).map((block, i) =>
              block.startsWith("## ") ? (
                <h3 key={i} className="pt-2 text-base font-semibold text-foreground">
                  {block.slice(3)}
                </h3>
              ) : block.startsWith("- ") ? (
                <ul key={i} className="list-disc space-y-1 pl-5">
                  {block.split("\n").map((li) => (
                    <li key={li}>{li.replace(/^- /, "")}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{block}</p>
              ),
            )}
          </div>
        )}
      </div>
    </article>
  );
}
