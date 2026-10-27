"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAnswersAction } from "@/app/actions/apply";

type Row = { key: number; question: string; answer: string };

export function AnswerBank({ initial }: { initial: { id: number; question: string; answer: string }[] }) {
  const [rows, setRows] = useState<Row[]>(initial.map((a) => ({ key: a.id, question: a.question, answer: a.answer })));
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  return (
    <div className="grid gap-4">
      {rows.map((r) => (
        <div key={r.key} className="grid gap-1.5 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label="Question"
              value={r.question}
              onChange={(e) => update(r.key, { question: e.target.value })}
              placeholder="Question"
              className="h-8 border-transparent px-1 font-medium shadow-none focus-visible:border-input"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              aria-label="Remove question"
              onClick={() => {
                setRows((rs) => rs.filter((x) => x.key !== r.key));
                setDirty(true);
              }}
            >
              <Trash2 />
            </Button>
          </div>
          <textarea
            aria-label={r.question || "Answer"}
            value={r.answer}
            onChange={(e) => update(r.key, { answer: e.target.value })}
            placeholder="Your answer"
            rows={1}
            className="min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setRows((rs) => [...rs, { key: Date.now(), question: "", answer: "" }]);
            setDirty(true);
          }}
        >
          <Plus /> Add question
        </Button>
        <Button
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              await saveAnswersAction(rows);
              setDirty(false);
            })
          }
        >
          {dirty ? "Save answers" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
