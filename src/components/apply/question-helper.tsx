"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BookmarkPlus, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addAnswerAction, draftAnswerAction } from "@/app/actions/apply";
import type { AnswerLength } from "@/lib/ai";
import { CopyButton } from "./copy-button";

const LENGTHS: { id: AnswerLength; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

const FIELD =
  "w-full rounded-md border border-input bg-transparent p-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function QuestionHelper({ jobId, hasAi }: { jobId: number; hasAi: boolean }) {
  const [question, setQuestion] = useState("");
  const [length, setLength] = useState<AnswerLength>("medium");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [saving, startSave] = useTransition();

  function draft() {
    setError(null);
    start(async () => {
      const result = await draftAnswerAction(jobId, question, length);
      if (result.error) setError(result.error);
      if (result.content !== null) {
        setAnswer(result.content);
        setSavedFor(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer a question</CardTitle>
        <CardDescription>Paste a question from the application and get a draft answer based on your resume and this job.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <textarea
          aria-label="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Tell us about a project you're proud of."
          rows={2}
          className={FIELD}
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Answer length" className="flex rounded-md border p-0.5">
            {LENGTHS.map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={length === l.id}
                onClick={() => setLength(l.id)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${length === l.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button className="ml-auto" onClick={draft} disabled={!hasAi || pending || !question.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} {answer ? "Draft again" : "Draft answer"}
          </Button>
        </div>
        {!hasAi && (
          <p className="text-xs text-muted-foreground">
            Drafting answers needs an Anthropic API key. Add one in{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>
            .
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        {answer && (
          <div className="grid gap-2 border-t pt-3">
            <textarea
              aria-label="Draft answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`${FIELD} leading-relaxed ${pending ? "opacity-50" : ""}`}
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <div className="flex items-center gap-1">
              <CopyButton value={answer} label="answer" />
              <span className="text-xs text-muted-foreground">Read it over and make it sound like you before pasting.</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                disabled={saving || savedFor === answer}
                onClick={() =>
                  startSave(async () => {
                    await addAnswerAction(question, answer);
                    setSavedFor(answer);
                  })
                }
              >
                {savedFor === answer ? <Check /> : <BookmarkPlus />} {savedFor === answer ? "In answer bank" : "Save to answer bank"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
