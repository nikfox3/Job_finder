import { CircleX, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Freshness } from "@/lib/freshness";

const STYLES = {
  closed: { icon: CircleX, className: "text-danger" },
  stale: { icon: Hourglass, className: "text-warning" },
};

export function FreshnessBadge({ freshness, className }: { freshness: Freshness; className?: string }) {
  if (freshness.kind === "fresh") return null;
  const { icon: Icon, className: tone } = STYLES[freshness.kind];
  return (
    <span className={cn("inline-flex items-center gap-1", tone, className)} title={freshness.detail ?? undefined}>
      <Icon className="size-3.5" />
      {freshness.label}
    </span>
  );
}

/** A fuller note for the job details panel. */
export function FreshnessNote({ freshness }: { freshness: Freshness }) {
  if (freshness.kind === "fresh") return null;
  const { icon: Icon } = STYLES[freshness.kind];
  return (
    <div className={cn("mt-4 flex gap-2.5 rounded-lg px-3 py-2.5 text-sm", freshness.kind === "closed" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning")}>
      <Icon className="size-4 shrink-0 translate-y-0.5" />
      <p>
        <span className="font-medium">{freshness.label}.</span> {freshness.detail}
      </p>
    </div>
  );
}
