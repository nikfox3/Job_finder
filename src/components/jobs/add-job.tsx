"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importJobAction, type ImportState } from "@/app/actions/jobs";

export function AddJob() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ImportState, FormData>(importJobAction, { status: "idle" });
  const router = useRouter();

  useEffect(() => {
    if (state.status === "done") {
      setOpen(false);
      router.push(`/jobs?job=${state.jobId}`);
    }
  }, [state, router]);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add from link
      </Button>
    );
  }

  // Rendered inside a wrapping flex row: basis-full drops the panel onto its own line.

  const draft = state.status === "needs-details" ? state.draft : null;

  return (
    <div className="order-last basis-full rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Link2 className="size-4" /> Add a job from a link
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Paste a LinkedIn, Indeed, Dribbble, Wellfound or company careers link. It&apos;s saved to your board.</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
          <X />
        </Button>
      </div>
      <form action={action} className="grid gap-4">
        <Input name="url" type="url" required placeholder="https://www.linkedin.com/jobs/view/…" defaultValue={state.status === "needs-details" ? state.url : ""} />
        {draft && (
          <>
            <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">{state.status === "needs-details" && state.message}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Job title</Label>
                <Input id="title" name="title" required defaultValue={draft.title ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" required defaultValue={draft.company ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={draft.location ?? ""} />
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" name="remote" defaultChecked={draft.remote ?? true} className="size-4 accent-[var(--primary)]" /> Remote
              </label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={draft.description ?? ""}
                className="min-h-28 rounded-md border border-input bg-transparent p-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
          </>
        )}
        {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
        <Button type="submit" disabled={pending} className="justify-self-end">
          {pending ? "Reading page…" : draft ? "Save job" : "Add job"}
        </Button>
      </form>
    </div>
  );
}
