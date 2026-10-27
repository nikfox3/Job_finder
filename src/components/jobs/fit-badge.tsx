import { cn } from "@/lib/utils";
import { fitTone } from "@/lib/fit";

const TONES = {
  success: "text-success",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

// A small ring that fills to the score.
export function FitBadge({ score, size = 40, className }: { score: number; size?: number; className?: string }) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", TONES[fitTone(score)], className)} style={{ width: size, height: size }} title={`Fit score ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums">{score}</span>
    </span>
  );
}
