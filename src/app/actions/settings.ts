"use server";

import { revalidatePath } from "next/cache";
import { saveSettings, type Settings } from "@/lib/settings";

export async function updateSettings(patch: Partial<Settings>) {
  saveSettings(patch);
  revalidatePath("/", "layout");
}
