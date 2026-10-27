"use server";

import { revalidatePath } from "next/cache";
import { PROFILE_FIELDS, saveProfile, type Profile } from "@/lib/profile";

export async function updateProfile(formData: FormData) {
  const profile: Partial<Profile> = {};
  for (const key of PROFILE_FIELDS) {
    const value = formData.get(key);
    if (typeof value === "string") profile[key] = value.trim() || null;
  }
  for (const key of ["portfolio_url", "linkedin_url"] as const) {
    const url = profile[key];
    if (url && !/^https?:\/\//i.test(url)) profile[key] = `https://${url}`;
  }
  saveProfile(profile);
  revalidatePath("/profile");
  revalidatePath("/");
}
