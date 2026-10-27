import { CircleHelp, LockKeyhole, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplyMethod } from "@/lib/apply-method";

const STYLES = {
  "no-account": { icon: Zap, label: "No account needed", className: "text-success" },
  account: { icon: LockKeyhole, label: "Account required", className: "text-danger" },
  unknown: { icon: CircleHelp, label: "Check application", className: "text-muted-foreground" },
};

export function ApplyMethodBadge({ method, showPlatform = false, className }: { method: ApplyMethod; showPlatform?: boolean; className?: string }) {
  const { icon: Icon, label, className: tone } = STYLES[method.kind];
  return (
    <span className={cn("inline-flex items-center gap-1", tone, className)} title={method.platform ? `Applies through ${method.platform}` : undefined}>
      <Icon className="size-3.5" />
      {label}
      {showPlatform && method.platform && <span className="text-muted-foreground">· via {method.platform}</span>}
    </span>
  );
}
