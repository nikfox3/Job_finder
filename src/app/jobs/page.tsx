import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { getSettings, JOB_SOURCES } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function JobsPage() {
  const settings = getSettings();
  const enabled = JOB_SOURCES.filter((s) => settings.sources[s.id]);
  return (
    <>
      <PageHeader title="Jobs" description={`Searching for: ${settings.keywords}${settings.remoteOnly ? " · remote only" : ""}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        {enabled.map((s) => (
          <Badge key={s.id} variant="outline">
            {s.name}
          </Badge>
        ))}
      </div>
      <EmptyState
        icon={Briefcase}
        title="No jobs yet"
        description="Live feeds from remote job boards, plus importing LinkedIn and Indeed links, are coming in the next step."
      />
    </>
  );
}
