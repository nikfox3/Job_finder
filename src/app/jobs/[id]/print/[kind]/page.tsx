import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/apply/print-toolbar";
import { getJob } from "@/lib/jobs";
import { getProfile, type Profile } from "@/lib/profile";
import { getDocument } from "@/lib/documents";
import { coverLetterTemplate, parseResume } from "@/lib/letters";
import { displayUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; kind: string }>;

const KINDS = { "cover-letter": "cover_letter", resume: "resume" } as const;
const NAMES = { "cover-letter": "Cover letter", resume: "Resume" } as const;

function load(id: string, kind: string) {
  const job = getJob(Number(id));
  if (!job || !(kind in KINDS)) notFound();
  return { job, kind: kind as keyof typeof KINDS };
}

// The browser uses the page title as the PDF's file name.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, kind } = await params;
  const { job, kind: k } = load(id, kind);
  const name = getProfile().full_name;
  return { title: [name, NAMES[k], job.company].filter(Boolean).join(" - ") };
}

function contactLine(profile: Profile) {
  return [profile.email, profile.phone, profile.location, displayUrl(profile.portfolio_url), displayUrl(profile.linkedin_url)].filter(Boolean) as string[];
}

function Letterhead({ profile, subtitle }: { profile: Profile; subtitle?: string | null }) {
  return (
    <header className="mb-8 border-b border-neutral-200 pb-5">
      <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name || "Your name"}</h1>
      {subtitle && <p className="mt-0.5 text-[15px] text-neutral-600">{subtitle}</p>}
      <p className="mt-2 text-xs text-neutral-500">{contactLine(profile).join("  ·  ")}</p>
    </header>
  );
}

export default async function PrintPage({ params }: { params: Params }) {
  const { id, kind: rawKind } = await params;
  const { job, kind } = load(id, rawKind);
  const profile = getProfile();
  const saved = getDocument(job.id, KINDS[kind])?.content;
  const text = saved ?? (kind === "cover-letter" ? coverLetterTemplate(job, profile) : (profile.resume_text ?? ""));
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <PrintToolbar backHref={`/jobs/${job.id}/apply`} />
      <div className="mx-auto max-w-[8.5in] bg-white px-[0.75in] py-[0.7in] text-[13.5px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-black/5 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        {kind === "cover-letter" ? (
          <>
            <Letterhead profile={profile} />
            <p className="mb-6 text-neutral-600">{today}</p>
            <div className="space-y-4">
              {text.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          </>
        ) : (
          <>
            <Letterhead profile={profile} subtitle={profile.headline} />
            <div className="space-y-2">
              {parseResume(text, [profile.full_name, profile.email, profile.phone].filter(Boolean) as string[]).map((block, i, blocks) =>
                block.type === "heading" ? (
                  <h2 key={i} className="pt-4 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase first:pt-0">
                    {block.lines[0]}
                  </h2>
                ) : block.type === "bullets" ? (
                  <ul key={i} className="list-disc space-y-1 pl-5 marker:text-neutral-400">
                    {block.lines.map((l, j) => (
                      <li key={j}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <div key={i} className="break-inside-avoid">
                    {block.lines.map((l, j) => (
                      <p key={j} className={j === 0 && (block.lines.length > 1 || blocks[i + 1]?.type === "bullets") && l.length < 90 ? "font-medium" : "text-neutral-700"}>
                        {l}
                      </p>
                    ))}
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
