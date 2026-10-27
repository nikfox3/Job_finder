import { PageHeader } from "@/components/page-header";
import { getSettings, JOB_SOURCES } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Saved automatically to your local database." />
      <div className="max-w-3xl">
        <SettingsForm initial={getSettings()} sources={JOB_SOURCES} />
      </div>
    </>
  );
}
