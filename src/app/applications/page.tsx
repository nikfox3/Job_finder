import { PageHeader } from "@/components/page-header";
import { getStats, STATUSES } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
  const { byStatus } = getStats();
  return (
    <>
      <PageHeader title="Applications" description="Track every role from saved to offer." />
      <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-6">
        {STATUSES.map((s) => (
          <div key={s.id} className="flex min-h-80 flex-col rounded-xl bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1 text-sm font-medium">
              {s.label}
              <span className="rounded-full bg-card px-2 text-xs text-muted-foreground tabular-nums">{byStatus[s.id]}</span>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              Nothing here yet
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
