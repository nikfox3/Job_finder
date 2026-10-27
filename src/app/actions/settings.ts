"use server";

import { revalidatePath } from "next/cache";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";
import { parseCareersUrl } from "@/lib/sources/companies";

export async function updateSettings(patch: Partial<Settings>) {
  saveSettings(patch);
  revalidatePath("/", "layout");
}

export type CompanyState = { error: string | null };

export async function addCompanyAction(_prev: CompanyState, form: FormData): Promise<CompanyState> {
  const link = String(form.get("link") ?? "");
  const parsed = parseCareersUrl(link);
  if (!parsed) {
    return { error: "Paste a careers link from Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee or Breezy, like boards.greenhouse.io/acme or apply.workable.com/acme." };
  }
  const name = String(form.get("name") ?? "").trim() || parsed.slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { companies } = getSettings();
  if (companies.some((c) => c.ats === parsed.ats && c.slug === parsed.slug)) return { error: `${name} is already on your list.` };
  saveSettings({ companies: [...companies, { ...parsed, name }] });
  revalidatePath("/settings");
  return { error: null };
}

export async function removeCompanyAction(ats: string, slug: string) {
  const { companies } = getSettings();
  saveSettings({ companies: companies.filter((c) => !(c.ats === ats && c.slug === slug)) });
  revalidatePath("/settings");
}
