import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { JobActions } from "@/components/jobs/job-actions";
import { WorkAuthSection } from "@/components/jobs/work-auth-section";
import { CopyButton } from "@/components/apply/copy-button";
import { DocEditor } from "@/components/apply/doc-editor";
import { getJob } from "@/lib/jobs";
import { getProfile } from "@/lib/profile";
import { getSettings } from "@/lib/settings";
import { listAnswers } from "@/lib/answers";
import { getDocument } from "@/lib/documents";
import { aiKey } from "@/lib/ai";
import { sourceName } from "@/lib/format";

export const dynamic = "force-dynamic";

function CopyRow({ label, value, empty }: { label: string; value: string | null; empty?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? <p className="text-sm break-words whitespace-pre-line">{value}</p> : <p className="text-sm text-muted-foreground italic">{empty ?? "Not set"}</p>}
      </div>
      {value && <CopyButton value={value} label={label} />}
    </div>
  );
}

function EditLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
      <Pencil className="size-3" /> {children}
    </Link>
  );
}

export default async function ApplyKitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) notFound();
  const profile = getProfile();
  const { homeCountry } = getSettings();
  const answers = listAnswers();
  const hasAi = Boolean(aiKey());
  const details = [
    { label: "Full name", value: profile.full_name },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone },
    { label: "Location", value: profile.location },
    { label: "Portfolio", value: profile.portfolio_url },
    { label: "LinkedIn", value: profile.linkedin_url },
  ];

  return (
    <>
      <Link href={`/jobs?job=${job.id}&where=all`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to job
      </Link>
      <header className="mb-6 rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo name={job.company} className="size-12 text-base" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Apply kit</p>
            <h1 className="text-xl font-semibold tracking-tight">{job.title}</h1>
            <p className="text-muted-foreground">{job.company}</p>
          </div>
        </div>
        <JobActions jobId={job.id} status={job.status} applyUrl={job.apply_url ?? job.url} sourceUrl={job.url} sourceName={sourceName(job.source)} showKit={false} />
        <p className="mt-4 text-sm text-muted-foreground">
          Open the application in a new tab and copy your details across. Nothing is sent anywhere until you press Submit on their site.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="grid gap-6">
          {homeCountry && <WorkAuthSection description={job.description} homeCountry={homeCountry} className="mb-0 bg-card" />}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Your details</CardTitle>
              <EditLink href="/profile">Edit</EditLink>
            </CardHeader>
            <CardContent className="divide-y pt-0">
              {details.map((d) => (
                <CopyRow key={d.label} {...d} />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="grid gap-1">
                <CardTitle>Answers</CardTitle>
                <CardDescription>Your saved answers to common questions.</CardDescription>
              </div>
              <EditLink href="/profile#answers">Edit</EditLink>
            </CardHeader>
            <CardContent className="divide-y pt-0">
              {answers.length === 0 && <p className="py-2.5 text-sm text-muted-foreground">No saved answers yet.</p>}
              {answers.map((a) => (
                <CopyRow key={a.id} label={a.question} value={a.answer || null} empty="No answer yet" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <DocEditor
            key={`cover-${job.id}`}
            jobId={job.id}
            kind="cover_letter"
            title="Cover letter"
            description={hasAi ? "Drafted from your resume and this posting. Edit it freely." : "A short starting point from your profile. Edit it freely."}
            initial={getDocument(job.id, "cover_letter")?.content ?? null}
            hasAi={hasAi}
          />
          <DocEditor
            key={`resume-${job.id}`}
            jobId={job.id}
            kind="resume"
            title="Resume"
            description="A copy of your resume for this job. Changes here don't touch your profile."
            initial={getDocument(job.id, "resume")?.content ?? null}
            hasAi={hasAi}
            blocked={
              profile.resume_text ? undefined : (
                <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Paste your resume on the{" "}
                  <Link href="/profile" className="text-primary hover:underline">
                    Profile
                  </Link>{" "}
                  page to make a printable copy for this job.
                </p>
              )
            }
          />
        </div>
      </div>
    </>
  );
}
