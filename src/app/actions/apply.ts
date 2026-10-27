"use server";

import { revalidatePath } from "next/cache";
import { saveAnswers } from "@/lib/answers";
import { deleteDocument, DOC_KINDS, saveDocument, type DocKind } from "@/lib/documents";
import { getJob } from "@/lib/jobs";
import { getProfile } from "@/lib/profile";
import { getStatus, setStatus } from "@/lib/applications";
import { setSecret } from "@/lib/settings";
import { coverLetterTemplate } from "@/lib/letters";
import { tailorResume, writeCoverLetter } from "@/lib/ai";

export async function saveAnswersAction(rows: { question: string; answer: string }[]) {
  saveAnswers(rows.map((r) => ({ question: r.question.trim(), answer: r.answer.trim() })).filter((r) => r.question));
  revalidatePath("/", "layout");
}

/** Keeps the job (and its documents) from being cleaned up with old listings. */
function keep(jobId: number) {
  if (!getStatus(jobId)) setStatus(jobId, "saved");
}

export async function saveDocumentAction(jobId: number, kind: DocKind, content: string) {
  if (!DOC_KINDS.includes(kind)) return;
  saveDocument(jobId, kind, content);
  keep(jobId);
  revalidatePath(`/jobs/${jobId}`, "layout");
}

export async function resetDocumentAction(jobId: number, kind: DocKind) {
  deleteDocument(jobId, kind);
  revalidatePath(`/jobs/${jobId}`, "layout");
}

export type DraftResult = { content: string | null; error: string | null };

export async function draftDocumentAction(jobId: number, kind: DocKind, useAi: boolean): Promise<DraftResult> {
  const job = getJob(jobId);
  if (!job || !DOC_KINDS.includes(kind)) return { content: null, error: "This job is no longer saved." };
  const profile = getProfile();
  if (kind === "resume" && !profile.resume_text) return { content: null, error: "Paste your resume on the Profile page first." };
  try {
    const content = useAi
      ? kind === "cover_letter"
        ? await writeCoverLetter(job, profile)
        : await tailorResume(job, profile)
      : kind === "cover_letter"
        ? coverLetterTemplate(job, profile)
        : (profile.resume_text ?? "");
    saveDocument(jobId, kind, content);
    keep(jobId);
    revalidatePath(`/jobs/${jobId}`, "layout");
    return { content, error: null };
  } catch (error) {
    return { content: null, error: error instanceof Error ? error.message : "Something went wrong writing the draft." };
  }
}

export async function saveApiKeyAction(key: string | null) {
  const value = key?.trim() || null;
  if (value && !value.startsWith("sk-ant-")) return { error: "That doesn't look like an Anthropic API key. It should start with sk-ant-." };
  setSecret("anthropic_api_key", value);
  revalidatePath("/", "layout");
  return { error: null };
}
