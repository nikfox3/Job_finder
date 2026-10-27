"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bookmark, CheckCircle2, ClipboardList, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setStatusAction, startApplyAction, toggleSaveAction } from "@/app/actions/applications";
import { STATUS_LABELS, type Status } from "@/lib/status";

type Props = { jobId: number; status: Status | null; applyUrl: string; sourceUrl: string; sourceName: string; showKit?: boolean };

export function JobActions({ jobId, status, applyUrl, sourceUrl, sourceName, showKit = true }: Props) {
  const [pending, start] = useTransition();
  const applied = status !== null && !["saved", "applying"].includes(status);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {status === "applying" ? (
        <Button disabled={pending} onClick={() => start(() => setStatusAction(jobId, "applied"))}>
          <CheckCircle2 /> Mark as applied
        </Button>
      ) : (
        <Button asChild>
          {/* A real link so the browser opens the tab; the status update runs alongside. */}
          <a href={applyUrl} target="_blank" rel="noreferrer" onClick={() => start(() => startApplyAction(jobId))}>
            <Send /> {applied ? "Open application" : "Apply"}
          </a>
        </Button>
      )}
      {status === "applying" && (
        <Button variant="outline" asChild>
          <a href={applyUrl} target="_blank" rel="noreferrer">
            <Send /> Open application
          </a>
        </Button>
      )}
      {showKit && (
        <Button variant="outline" asChild>
          <Link href={`/jobs/${jobId}/apply`}>
            <ClipboardList /> Apply kit
          </Link>
        </Button>
      )}
      {!applied && status !== "applying" && (
        <Button variant="outline" disabled={pending} onClick={() => start(() => toggleSaveAction(jobId))}>
          <Bookmark className={status ? "fill-current" : ""} /> {status ? "Saved" : "Save"}
        </Button>
      )}
      <Button variant="ghost" asChild>
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          <ExternalLink /> View on {sourceName}
        </a>
      </Button>
      {status && status !== "saved" && (
        <span className="ml-auto rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{STATUS_LABELS[status]}</span>
      )}
    </div>
  );
}
