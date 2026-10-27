"use server";

import { revalidatePath } from "next/cache";
import { refreshJobs, saveJobs } from "@/lib/ingest";
import { parseJobPage, sourceFromUrl } from "@/lib/import";
import { db } from "@/lib/db";
import type { JobInput } from "@/lib/sources/types";

export async function refreshAction() {
  const results = await refreshJobs();
  revalidatePath("/", "layout");
  return results;
}

export type ImportState =
  | { status: "idle" }
  | { status: "needs-details"; url: string; draft: Partial<JobInput>; message: string }
  | { status: "done"; jobId: number }
  | { status: "error"; message: string };

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

function save(url: string, job: Partial<JobInput>) {
  const source = sourceFromUrl(url);
  const externalId = url.replace(/[?#].*$/, "");
  saveJobs(source, [
    {
      ...job,
      externalId,
      title: job.title!,
      company: job.company!,
      url,
      remote: job.remote ?? false,
    },
  ]);
  const { id } = db.prepare("SELECT id FROM jobs WHERE source = ? AND external_id = ?").get(source, externalId) as { id: number };
  // Adding a job by hand means you're interested: put it on the board as Saved.
  db.prepare("INSERT INTO applications (job_id, status) VALUES (?, 'saved') ON CONFLICT (job_id) DO NOTHING").run(id);
  return id;
}

/** Step 1: fetch the page and read what we can. Step 2 (form re-submit): fill any gaps by hand. */
export async function importJobAction(_prev: ImportState, form: FormData): Promise<ImportState> {
  const raw = String(form.get("url") ?? "").trim();
  let url: string;
  try {
    url = new URL(raw).toString();
  } catch {
    return { status: "error", message: "That doesn't look like a link. Paste the full job URL." };
  }

  const manual = form.get("title") !== null;
  let draft: Partial<JobInput> = {};
  if (manual) {
    draft = {
      title: String(form.get("title") ?? "").trim(),
      company: String(form.get("company") ?? "").trim(),
      location: String(form.get("location") ?? "").trim() || null,
      remote: form.get("remote") === "on",
      description: String(form.get("description") ?? "").trim() || null,
    };
  } else {
    try {
      const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(15_000) });
      if (res.ok) draft = parseJobPage(await res.text(), url);
    } catch {
      // Fall through to manual entry.
    }
  }

  if (!draft.title || !draft.company) {
    return {
      status: "needs-details",
      url,
      draft,
      message: manual
        ? "Add at least a title and company."
        : "This site didn't share the job details (LinkedIn and Indeed often block this). Fill in the basics and it'll be saved.",
    };
  }

  const jobId = save(url, draft);
  revalidatePath("/", "layout");
  return { status: "done", jobId };
}
