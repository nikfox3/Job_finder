import { Globe2, MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Eligibility } from "@/lib/geo";

export function LocationBadge({ eligibility, className }: { eligibility: Eligibility; className?: string }) {
  const { tier, label } = eligibility;
  const Icon = tier === 2 ? Globe2 : tier === 4 ? MapPinOff : MapPin;
  const tone = tier <= 2 ? "text-success" : tier === 4 ? "text-danger" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1", tone, className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
