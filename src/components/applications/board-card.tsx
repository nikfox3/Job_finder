"use client";

import Link from "next/link";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { STATUSES, type Status } from "@/lib/status";
import { setStatusAction } from "@/app/actions/applications";
import { CompanyLogo } from "@/components/jobs/company-logo";

export function BoardCard({
  jobId,
  title,
  company,
  agency,
  status,
  note,
  closed = false,
}: {
  jobId: number;
  title: string;
  company: string;
  /** "Staffing agency" or "Design studio" when an agency posted it. */
  agency?: string;
  status: Status;
  note: string;
  closed?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className={cn("rounded-lg border bg-card p-3 shadow-xs transition-opacity", pending && "opacity-50")}>
      <Link href={`/jobs?job=${jobId}&where=all`} className="flex gap-2.5">
        <CompanyLogo name={company} className="size-8 text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium hover:underline">{title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {company}
            {agency && <span className="text-primary"> · {agency}</span>}
          </p>
        </div>
      </Link>
      <div className="mt-3 flex flex-col gap-2">
        <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {note}
          {closed && <span className="rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger">Posting closed</span>}
        </span>
        <select
          aria-label="Move to"
          value={status}
          disabled={pending}
          onChange={(e) => start(() => setStatusAction(jobId, e.target.value === "remove" ? null : (e.target.value as Status)))}
          className="h-7 w-full rounded-md border border-input bg-transparent px-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
          <option value="remove">Remove</option>
        </select>
      </div>
    </div>
  );
}
