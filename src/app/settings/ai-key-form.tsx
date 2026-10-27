"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveApiKeyAction } from "@/app/actions/apply";
import { updateSettings } from "@/app/actions/settings";

export type AiKeyStatus = { source: "settings" | "env" | null; hint: string | null };

export function AiKeyForm({ status, writingGuide }: { status: AiKeyStatus; writingGuide: string }) {
  const [key, setKey] = useState("");
  const [guide, setGuide] = useState(writingGuide);
  const [savedGuide, setSavedGuide] = useState(writingGuide);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(value: string | null) {
    setError(null);
    start(async () => {
      const result = await saveApiKeyAction(value);
      if (result.error) setError(result.error);
      else setKey("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI writing</CardTitle>
        <CardDescription>
          Optional. With your own Anthropic API key, the apply kit can write tailored cover letters and resumes. Without one, you get simple templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {status.source && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2">
              <KeyRound className="size-4 text-success" />
              {status.source === "env" ? "Using ANTHROPIC_API_KEY from your environment." : `Key saved, ending in ${status.hint}.`}
            </span>
            {status.source === "settings" && (
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => save(null)}>
                Remove
              </Button>
            )}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="apiKey">{status.source ? "Replace key" : "API key"}</Label>
          <div className="flex gap-2">
            <Input id="apiKey" type="password" autoComplete="off" placeholder="sk-ant-..." value={key} onChange={(e) => setKey(e.target.value)} />
            <Button variant="outline" disabled={pending || !key.trim()} onClick={() => save(key)}>
              Save
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Stored only in your local database. Get a key at{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              console.anthropic.com
            </a>
            . Each draft costs a few cents.
          </p>
        </div>
        <div className="grid gap-2 border-t pt-4">
          <Label htmlFor="writingGuide">Your writing rules</Label>
          <textarea
            id="writingGuide"
            value={guide}
            onChange={(e) => setGuide(e.target.value)}
            rows={3}
            placeholder={"e.g. Keep it friendly but not casual.\nMention that I work well with engineers.\nNever mention my previous employer by name."}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Applied to AI cover letters and answers, on top of the built-in rules (short, specific to the job, no made-up facts).</p>
            <Button
              variant="outline"
              disabled={pending || guide === savedGuide}
              onClick={() =>
                start(async () => {
                  await updateSettings({ writingGuide: guide.trim() });
                  setSavedGuide(guide);
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
