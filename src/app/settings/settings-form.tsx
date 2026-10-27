"use client";

import { useActionState, useState, useTransition } from "react";
import { Building2, ShieldAlert, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { addCompanyAction, removeCompanyAction, updateSettings } from "@/app/actions/settings";
import type { Settings, SourceInfo } from "@/lib/settings";
import { ATS_NAMES } from "@/lib/sources/companies";
import { COUNTRIES } from "@/lib/geo";

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

export function SettingsForm({ initial, sources }: { initial: Settings; sources: SourceInfo[] }) {
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
          <Row id="homeCountry" title="Where you live" description="Jobs limited to other countries are tagged and can be hidden. Sort by Closest to see yours first.">
            <select
              id="homeCountry"
              value={settings.homeCountry}
              onChange={(e) => save({ homeCountry: e.target.value })}
              className="h-9 w-52 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="">Not set</option>
              {[...COUNTRIES]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Row>
          {settings.homeCountry && (
            <Row
              id="locationScope"
              title="Show jobs"
              description="Country only shows roles that name your country (like “US only”), so you skip ones meant for other countries or worldwide hiring."
            >
              <select
                id="locationScope"
                value={settings.locationScope}
                onChange={(e) => save({ locationScope: e.target.value as Settings["locationScope"] })}
                className="h-9 w-52 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="home">{COUNTRIES.find((c) => c.code === settings.homeCountry)?.name} only</option>
                <option value="open">Open to {COUNTRIES.find((c) => c.code === settings.homeCountry)?.name}</option>
                <option value="all">All locations</option>
              </select>
            </Row>
          )}
          <Row id="remoteOnly" title="Remote only" description="Hide roles that need you in an office.">
            <Switch id="remoteOnly" checked={settings.remoteOnly} onCheckedChange={(v) => save({ remoteOnly: v })} />
          </Row>
          <Row
            id="hideAccountRequired"
            title="Hide jobs that need an account"
            description="Skip roles whose application makes you sign up or log in first (e.g. Workday, Taleo, iCIMS)."
          >
            <Switch id="hideAccountRequired" checked={settings.hideAccountRequired} onCheckedChange={(v) => save({ hideAccountRequired: v })} />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job sources</CardTitle>
          <CardDescription>Remote-focused boards with free public feeds, checked every few hours. LinkedIn and Indeed jobs are added with &quot;Add from link&quot; on the Jobs page.</CardDescription>
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

      <CompanyWatchlist companies={initial.companies} />
    </div>
  );
}

function CompanyWatchlist({ companies }: { companies: Settings["companies"] }) {
  const [state, action, pending] = useActionState(addCompanyAction, { error: null });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company watchlist</CardTitle>
        <CardDescription>
          Follow companies you&apos;d love to work for. Their design openings come straight from their careers page. Works with Greenhouse, Lever and
          Ashby, which also don&apos;t need an account to apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={action} className="flex flex-wrap gap-2">
          <Input name="link" required placeholder="boards.greenhouse.io/acme or jobs.lever.co/acme" className="min-w-64 flex-[2]" />
          <Input name="name" placeholder="Company name (optional)" className="min-w-40 flex-1" />
          <Button type="submit" variant="outline" disabled={pending}>
            Add
          </Button>
        </form>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {companies.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {companies.map((c) => (
              <li key={`${c.ats}:${c.slug}`} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">
                  {ATS_NAMES[c.ats]} · {c.slug}
                </span>
                <Button variant="ghost" size="icon" className="ml-auto size-8" aria-label={`Remove ${c.name}`} onClick={() => removeCompanyAction(c.ats, c.slug)}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
