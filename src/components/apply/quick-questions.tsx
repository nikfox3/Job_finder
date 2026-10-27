"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Fact, QuickQuestion } from "@/lib/ai";

/** A few yes/no or few-word questions asked before writing a cover letter. All optional. */
export function QuickQuestions({ questions, onDone }: { questions: QuickQuestion[]; onDone: (facts: Fact[]) => void }) {
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const set = (i: number, value: string) => setAnswers((a) => a.map((v, j) => (j === i ? value : v)));

  return (
    <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">A few quick questions</p>
        <p className="text-xs text-muted-foreground">Optional. They help the letter speak to this job. Your answers are saved, so you won&apos;t be asked again.</p>
      </div>
      {questions.map((q, i) => (
        <div key={q.question} className="grid gap-1.5">
          <p className="text-sm">{q.question}</p>
          {q.type === "yes_no" ? (
            <div className="flex gap-2">
              {["Yes", "No"].map((option) => (
                <button
                  key={option}
                  aria-pressed={answers[i] === option}
                  onClick={() => set(i, answers[i] === option ? "" : option)}
                  className={cn(
                    "h-8 rounded-md border px-4 text-sm transition-colors",
                    answers[i] === option ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:bg-muted",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <Input aria-label={q.question} value={answers[i]} maxLength={120} placeholder="A few words" onChange={(e) => set(i, e.target.value)} />
          )}
        </div>
      ))}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => onDone([])}>
          Skip
        </Button>
        <Button onClick={() => onDone(questions.map((q, i) => ({ question: q.question, answer: answers[i] })).filter((f) => f.answer.trim()))}>
          <Sparkles /> Write letter
        </Button>
      </div>
    </div>
  );
}
