import Link from "next/link";
import { ArrowUpRight, Building2, Check, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { AddAgency, RemoveAgency, WatchStudio } from "@/components/agencies/agency-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { agencyMatcher, allAgencies, type Agency, type AgencyKind } from "@/lib/agencies";
import { listJobs, type Job } from "@/lib/jobs";
import { getSettings } from "@/lib/settings";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const SECTIONS: { kind: AgencyKind; id: string; title: string; description: string }[] = [
  {
    kind: "staffing",
    id: "staffing",
    title: "Staffing agencies",
    description:
      "They place designers in contract, contract-to-hire and full-time roles at their clients. Most ask you to make one profile, then a recruiter brings roles to you, so you skip the forms for each job.",
  },
  {
    kind: "studio",
    id: "studios",
    title: "Design agencies and studios",
    description: "Agencies that hire designers directly to work on client projects. Watch one to pull its openings into Jobs.",
  },
];

export default function AgenciesPage() {
  const settings = getSettings();
  const agencies = allAgencies(settings.agencies);
  const match = agencyMatcher(agencies);
  const jobsBy = new Map<Agency, Job[]>();
  for (const job of listJobs()) {
    if (job.closed_at) continue;
    const agency = match(job.company);
    if (agency) jobsBy.set(agency, [...(jobsBy.get(agency) ?? []), job]);
  }
  const watched = new Set(settings.companies.map((c) => c.name.toLowerCase()));

  return (
    <>
      <PageHeader title="Agencies" description="Staffing agencies and design studios that hire designers, with the roles they have open in your feed." />
      <nav className="-mt-4 mb-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const count = agencies.filter((a) => a.kind === s.kind).length;
          return (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {s.title} <span className="tabular-nums">({count})</span>
            </a>
          );
        })}
      </nav>
      <div className="grid gap-12">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-6">
            <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
            <p className="mt-1 mb-5 max-w-3xl text-sm text-muted-foreground">{s.description}</p>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {agencies
                .filter((a) => a.kind === s.kind)
                // Agencies with open roles first.
                .sort((a, b) => (jobsBy.get(b)?.length ?? 0) - (jobsBy.get(a)?.length ?? 0))
                .map((a) => (
                  <AgencyCard key={a.name} agency={a} jobs={jobsBy.get(a) ?? []} watching={watched.has(a.name.toLowerCase())} />
                ))}
            </div>
          </section>
        ))}
        <Card>
          <CardHeader>
            <CardTitle>Add an agency</CardTitle>
            <CardDescription>Know a recruiter or studio that isn&apos;t listed? Add it here and its jobs get tagged as agency roles too.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddAgency />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AgencyCard({ agency: a, jobs, watching }: { agency: Agency; jobs: Job[]; watching: boolean }) {
  const shown = jobs.slice(0, 3);
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 pt-5">
        <div className="flex items-start gap-3">
          <CompanyLogo name={a.name} />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium">{a.name}</h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {a.based && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {a.based}
                </span>
              )}
              {a.custom && <span>Added by you</span>}
            </p>
          </div>
          {a.remote && <Badge variant="success">{a.remote}</Badge>}
          {a.custom && <RemoveAgency name={a.name} />}
        </div>
        {a.about && <p className="text-sm">{a.about}</p>}
        {a.focus.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {a.focus.map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-auto grid gap-1.5 border-t pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" />
            {jobs.length ? `${jobs.length} open ${jobs.length === 1 ? "role" : "roles"} in your feed` : "No roles in your feed right now"}
          </p>
          {shown.map((j) => (
            <Link key={j.id} href={`/jobs?job=${j.id}&where=all`} className="flex items-baseline justify-between gap-2 text-sm hover:underline">
              <span className="truncate">{j.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(j.posted_at)}</span>
            </Link>
          ))}
          {jobs.length > shown.length && (
            <Link href={`/jobs?agency=${encodeURIComponent(a.name)}&where=all`} className="text-xs text-primary hover:underline">
              See all {jobs.length}
            </Link>
          )}
        </div>
        <div className="-mx-2 -mb-2 flex flex-wrap items-center gap-1">
          {(a.jobsUrl || a.website) && (
            <a href={a.jobsUrl ?? a.website} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary hover:bg-muted">
              {a.kind === "staffing" ? "Their job board" : "Website"} <ArrowUpRight className="size-3.5" />
            </a>
          )}
          {a.kind === "studio" &&
            (watching ? (
              <span className="ml-auto flex items-center gap-1 px-2 text-xs text-success">
                <Check className="size-3.5" /> Watching
              </span>
            ) : (
              <div className="ml-auto">
                <WatchStudio name={a.name} />
              </div>
            ))}
          {a.kind === "staffing" && (
            <span className="ml-auto flex items-center gap-1 px-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5" /> One profile to apply
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
