import { Building2 } from "lucide-react";
import { AGENCY_KINDS, type Agency } from "@/lib/agencies";
import { cn } from "@/lib/utils";

/** Marks a job posted by a staffing agency or design studio. */
export function AgencyBadge({ agency, className }: { agency: Agency | null; className?: string }) {
  if (!agency) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary", className)}>
      <Building2 className="size-3" /> {AGENCY_KINDS[agency.kind]}
    </span>
  );
}
