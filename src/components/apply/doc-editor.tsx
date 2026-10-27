"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FileDown, FileText, Loader2, RotateCcw, Save, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { draftDocumentAction, resetDocumentAction, saveDocumentAction } from "@/app/actions/apply";
import type { DocKind } from "@/lib/documents";
import { findPlaceholders } from "@/lib/letters";

type Props = {
  jobId: number;
  kind: DocKind;
  title: string;
  description: string;
  initial: string | null;
  hasAi: boolean;
  /** Shown instead of the editor when a draft can't be made yet. */
  blocked?: React.ReactNode;
};

const COPY = {
  cover_letter: { template: "Draft from template", ai: "Write with AI", redoAi: "Rewrite with AI", redoTemplate: "Start over from template" },
  resume: { template: "Start from my resume", ai: "Tailor with AI", redoAi: "Tailor again with AI", redoTemplate: "Reset to my resume" },
};

export function DocEditor({ jobId, kind, title, description, initial, hasAi, blocked }: Props) {
  const [text, setText] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState<"ai" | "template" | null>(null);
  const [pending, start] = useTransition();
  const copy = COPY[kind];
  const dirty = text !== saved;
  const notes = findPlaceholders(text);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const printHref = `/jobs/${jobId}/print/${kind === "cover_letter" ? "cover-letter" : "resume"}`;

  function draft(useAi: boolean) {
    if (dirty && text && !confirm("Replace your edits with a new draft?")) return;
    setError(null);
    setWriting(useAi ? "ai" : "template");
    start(async () => {
      const result = await draftDocumentAction(jobId, kind, useAi);
      setWriting(null);
      if (result.error) setError(result.error);
      if (result.content !== null) {
        setText(result.content);
        setSaved(result.content);
      }
    });
  }

  function save() {
    start(async () => {
      await saveDocumentAction(jobId, kind, text);
      setSaved(text);
    });
  }

  async function openPdf() {
    // Save first so the print page shows what's in the editor.
    if (dirty) {
      await saveDocumentAction(jobId, kind, text);
      setSaved(text);
    }
    window.open(printHref, "_blank");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="grid gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {saved && (
          <Button variant="outline" size="sm" onClick={openPdf} disabled={pending}>
            <FileDown /> Save as PDF
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        {blocked ? (
          blocked
        ) : !text && !writing ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center">
            <FileText className="size-6 text-muted-foreground" />
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant={hasAi ? "outline" : "default"} onClick={() => draft(false)} disabled={pending}>
                {copy.template}
              </Button>
              {hasAi && (
                <Button onClick={() => draft(true)} disabled={pending}>
                  <Sparkles /> {copy.ai}
                </Button>
              )}
            </div>
            {!hasAi && (
              <p className="text-xs text-muted-foreground">
                Want a tailored draft? Add an Anthropic API key in{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Settings
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <>
            {writing === "ai" ? (
              <div className="flex min-h-80 items-center justify-center gap-2 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Writing your draft. This usually takes under a minute.
              </div>
            ) : (
              <textarea
                aria-label={title}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-80 w-full rounded-md border border-input bg-transparent p-3 text-sm leading-relaxed shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
            )}
            {kind === "cover_letter" && !writing && (
              <p className={`-mt-1 text-right text-xs ${words > 220 ? "text-warning" : "text-muted-foreground"}`}>
                {words} words{words > 220 ? ". Most hiring managers prefer under 200." : ""}
              </p>
            )}
            {notes.length > 0 && !writing && (
              <p className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                <TriangleAlert className="size-3.5 shrink-0 translate-y-px" />
                {notes.length === 1 ? "1 note" : `${notes.length} notes`} in [brackets] to fill in or delete before you send it.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={save} disabled={pending || !dirty}>
                <Save /> {dirty ? "Save" : "Saved"}
              </Button>
              {hasAi && (
                <Button size="sm" variant="outline" onClick={() => draft(true)} disabled={pending}>
                  <Sparkles /> {copy.redoAi}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => draft(false)} disabled={pending}>
                <RotateCcw /> {copy.redoTemplate}
              </Button>
              {saved && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-muted-foreground"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await resetDocumentAction(jobId, kind);
                      setText("");
                      setSaved("");
                    })
                  }
                >
                  Delete draft
                </Button>
              )}
            </div>
          </>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
