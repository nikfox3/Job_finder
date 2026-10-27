import { PageHeader } from "@/components/page-header";
import { BoardCard } from "@/components/applications/board-card";
import { listBoard } from "@/lib/applications";
import { STATUSES } from "@/lib/stats";
import { timeAgoPrecise } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
  const cards = listBoard();
  return (
    <>
      <PageHeader title="Applications" description="Track every role from saved to offer. Save or apply to a job and it shows up here." />
      <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-6">
        {STATUSES.map((s) => {
          const column = cards.filter((c) => c.status === s.id);
          return (
            <div key={s.id} className="flex min-h-80 flex-col rounded-xl bg-muted/50 p-3">
              <div className="mb-3 flex items-center justify-between px-1 text-sm font-medium">
                {s.label}
                <span className="rounded-full bg-card px-2 text-xs text-muted-foreground tabular-nums">{column.length}</span>
              </div>
              {column.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">Nothing here yet</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {column.map((c) => (
                    <BoardCard
                      key={c.job_id}
                      jobId={c.job_id}
                      title={c.title}
                      company={c.company}
                      status={c.status}
                      note={c.applied_at ? `Applied ${timeAgoPrecise(c.applied_at)}` : `Updated ${timeAgoPrecise(c.updated_at)}`}
                      // Only worth flagging before you've applied.
                      closed={Boolean(c.closed_at) && (c.status === "saved" || c.status === "applying")}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
