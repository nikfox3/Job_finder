"use server";

import { revalidatePath } from "next/cache";
import { PROFILE_FIELDS, saveProfile, type Profile } from "@/lib/profile";

export async function updateProfile(formData: FormData) {
  const profile: Partial<Profile> = {};
  for (const key of PROFILE_FIELDS) {
    const value = formData.get(key);
    if (typeof value === "string") profile[key] = value.trim() || null;
  }
  saveProfile(profile);
  revalidatePath("/profile");
  revalidatePath("/");
}
