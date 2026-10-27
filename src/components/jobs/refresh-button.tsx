"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshAction } from "@/app/actions/jobs";
import type { RunResult } from "@/lib/ingest";
import { cn } from "@/lib/utils";

export function RefreshButton({ updated }: { updated: string | null }) {
  const [pending, start] = useTransition();
  const [results, setResults] = useState<RunResult[] | null>(null);

  const ran = results?.filter((r) => !r.skipped) ?? [];
  const added = ran.reduce((n, r) => n + r.added, 0);
  const failed = ran.filter((r) => r.error);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{pending ? "Checking job boards…" : updated ? `Updated ${updated}` : "Not updated yet"}</span>
        <Button variant="outline" disabled={pending} onClick={() => start(async () => setResults(await refreshAction()))}>
          <RefreshCw className={cn(pending && "animate-spin")} /> Refresh
        </Button>
      </div>
      {results && !pending && (
        <div className="text-right text-xs">
          <p className="text-muted-foreground">
            {ran.length === 0
              ? "Everything is up to date."
              : failed.length === ran.length
                ? "Couldn't reach any job boards."
                : `${added} new ${added === 1 ? "job" : "jobs"} from ${ran.length - failed.length} ${ran.length - failed.length === 1 ? "source" : "sources"}.`}
          </p>
          {failed.map((r) => (
            <p key={r.source} className="text-danger">
              {r.name}: {r.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
