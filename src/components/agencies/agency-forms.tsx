"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAgencyAction, addCompanyAction, removeAgencyAction } from "@/app/actions/settings";

const selectClass =
  "h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Adds a studio's careers page to the company watchlist so its roles show up in Jobs. */
export function WatchStudio({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addCompanyAction, { error: null });
  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Eye /> Watch their jobs
      </Button>
    );
  }
  return (
    <form action={action} className="grid w-full gap-2">
      <input type="hidden" name="name" value={name} />
      <div className="flex gap-2">
        <Input name="link" required autoFocus placeholder="Their Greenhouse, Lever or Ashby link" className="h-8 flex-1 text-xs" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Watch
        </Button>
      </div>
      <p className={`text-xs ${state.error ? "text-danger" : "text-muted-foreground"}`}>
        {state.error ?? "Open their careers page, click any job, and paste the link here if it's on one of these."}
      </p>
    </form>
  );
}

export function RemoveAgency({ name }: { name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove ${name}`} disabled={pending} onClick={() => start(() => removeAgencyAction(name))}>
      <Trash2 />
    </Button>
  );
}

export function AddAgency() {
  const [state, action, pending] = useActionState(addAgencyAction, { error: null });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state.ok]);
  return (
    <form ref={form} action={action} className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Input name="name" required placeholder="Agency name" className="min-w-40 flex-1" />
        <select name="kind" aria-label="Type" className={selectClass} defaultValue="studio">
          <option value="studio">Design studio</option>
          <option value="staffing">Staffing agency</option>
        </select>
        <Input name="website" placeholder="Website (optional)" className="min-w-48 flex-1" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input name="note" placeholder="A note for yourself (optional)" className="min-w-64 flex-1" />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus /> Add agency
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
