import { PageHeader } from "@/components/page-header";
import { getSecret, getSettings, JOB_SOURCES } from "@/lib/settings";
import { SettingsForm } from "./settings-form";
import { AiKeyForm, type AiKeyStatus } from "./ai-key-form";

export const dynamic = "force-dynamic";

function aiKeyStatus(): AiKeyStatus {
  // Only the last four characters ever reach the browser.
  const saved = getSecret("anthropic_api_key");
  if (saved) return { source: "settings", hint: saved.slice(-4) };
  return { source: process.env.ANTHROPIC_API_KEY ? "env" : null, hint: null };
}

export default function SettingsPage() {
  const settings = getSettings();
  return (
    <>
      <PageHeader title="Settings" description="Saved automatically to your local database." />
      <div className="grid max-w-3xl gap-6">
        <SettingsForm initial={settings} sources={JOB_SOURCES} />
        <AiKeyForm status={aiKeyStatus()} writingGuide={settings.writingGuide} />
      </div>
    </>
  );
}
