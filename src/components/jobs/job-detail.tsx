import { Bookmark, Briefcase, Clock, ExternalLink, Globe2, MapPin, Send, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalary, sourceName, timeAgo } from "@/lib/format";
import type { Job } from "@/lib/jobs";
import { CompanyLogo } from "./company-logo";

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

export function JobDetail({ job }: { job: Job }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  return (
    <article className="flex h-full flex-col rounded-xl border bg-card">
      <header className="border-b p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo name={job.company} className="size-12 text-base" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{job.title}</h2>
            <p className="mt-0.5 text-muted-foreground">{job.company}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button>
            <Send /> Apply
          </Button>
          <Button variant="outline">
            <Bookmark className={job.status ? "fill-current" : ""} /> {job.status ? "Saved" : "Save"}
          </Button>
          <Button variant="ghost" asChild>
            <a href={job.url} target="_blank" rel="noreferrer">
              <ExternalLink /> View on {sourceName(job.source)}
            </a>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 border-b p-6 xl:grid-cols-3">
        <Fact icon={Wallet} label="Salary" value={salary} />
        <Fact icon={MapPin} label="Location" value={job.remote ? `Remote${job.location ? ` · ${job.location}` : ""}` : job.location} />
        <Fact icon={Globe2} label="Timezone" value={job.timezone} />
        <Fact icon={Briefcase} label="Type" value={[job.employment_type, job.seniority].filter(Boolean).join(" · ") || null} />
        <Fact icon={Clock} label="Posted" value={timeAgo(job.posted_at)} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {job.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {job.tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
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
      </div>
    </article>
  );
}
