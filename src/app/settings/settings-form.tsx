"use client";

import { useState, useTransition } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/app/actions/settings";
import type { JobSourceId, Settings } from "@/lib/settings";

type Source = { id: JobSourceId; name: string; description: string };

function Row({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <Label htmlFor={id}>{title}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsForm({ initial, sources }: { initial: Settings; sources: Source[] }) {
  const [settings, setSettings] = useState(initial);
  const [keywords, setKeywords] = useState(initial.keywords);
  const [pending, startTransition] = useTransition();

  function save(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
    startTransition(() => updateSettings(patch));
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Applying</CardTitle>
          <CardDescription>How Career Ops handles the final submit.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <Row
            id="autoSubmit"
            title="Auto-submit applications"
            description="When off, Career Ops prefills everything and you press Submit yourself. When on, it submits simple forms (Greenhouse, Lever) for you."
          >
            <Switch id="autoSubmit" checked={settings.autoSubmit} onCheckedChange={(v) => save({ autoSubmit: v })} />
          </Row>
          {settings.autoSubmit && (
            <div className="flex gap-3 rounded-lg bg-warning/10 p-3 text-sm text-warning">
              <ShieldAlert className="size-4 shrink-0 translate-y-0.5" />
              Auto-submit sends applications without a final review. Double-check your profile and resume first.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job search</CardTitle>
          <CardDescription>What the job feeds look for.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <div className="grid gap-2 pb-4">
            <Label htmlFor="keywords">Keywords</Label>
            <div className="flex gap-2">
              <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              <Button variant="outline" disabled={pending || keywords === settings.keywords} onClick={() => save({ keywords })}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Comma separated. Jobs matching any keyword are shown.</p>
          </div>
          <Row id="remoteOnly" title="Remote only" description="Hide roles that need you in an office.">
            <Switch id="remoteOnly" checked={settings.remoteOnly} onCheckedChange={(v) => save({ remoteOnly: v })} />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job sources</CardTitle>
          <CardDescription>Remote-focused boards with free public feeds. LinkedIn and Indeed jobs are added by pasting a link.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {sources.map((s) => (
            <Row key={s.id} id={`source-${s.id}`} title={s.name} description={s.description}>
              <Switch
                id={`source-${s.id}`}
                checked={settings.sources[s.id]}
                onCheckedChange={(v) => save({ sources: { ...settings.sources, [s.id]: v } })}
              />
            </Row>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
