"use server";

import { revalidatePath } from "next/cache";
import { getStatus, setStatus } from "@/lib/applications";
import { STATUSES, type Status } from "@/lib/stats";

const ORDER = STATUSES.map((s) => s.id);

function refresh() {
  revalidatePath("/", "layout");
}

export async function toggleSaveAction(jobId: number) {
  setStatus(jobId, getStatus(jobId) ? null : "saved");
  refresh();
}

/** Called when you open an application: moves the job to Applying unless it's already further along. */
export async function startApplyAction(jobId: number) {
  const current = getStatus(jobId);
  if (!current || ORDER.indexOf(current) < ORDER.indexOf("applying")) setStatus(jobId, "applying");
  refresh();
}

export async function setStatusAction(jobId: number, status: Status | null) {
  if (status !== null && !ORDER.includes(status)) return;
  setStatus(jobId, status);
  refresh();
}
