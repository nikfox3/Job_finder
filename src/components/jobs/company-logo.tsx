import { cn } from "@/lib/utils";
import { companyHue } from "@/lib/format";

export function CompanyLogo({ name, className }: { name: string; className?: string }) {
  const hue = companyHue(name);
  return (
    <span
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold", className)}
      style={{ background: `oklch(0.7 0.12 ${hue} / 0.18)`, color: `oklch(0.72 0.14 ${hue})` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
