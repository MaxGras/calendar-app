"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: string };

export async function updateProfile(input: {
  userId: string;
  fullName: string;
  color: string;
}): Promise<ActionResult> {
  console.error("[updateProfile] Input received:", input);
  console.error("[updateProfile] User ID:", input.userId);

  const supabase = await createClient();

  // Fetch the profile using userId to verify it exists and get current data
  console.error("[updateProfile] Fetching profile...");
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", input.userId)
    .single();

  console.error("[updateProfile] Profile fetch result:", {
    found: !!profile,
    id: profile?.id,
    email: profile?.email,
    error: fetchError?.message,
  });

  if (!profile) {
    return { error: `Profile not found for ID: ${input.userId}` };
  }

  const updateData = {
    full_name: input.fullName.trim() || profile.full_name,
    color: input.color,
  };

  console.error("[updateProfile] Sending to database:", {
    userId: input.userId,
    ...updateData,
  });
  console.error("[updateProfile], id", input.userId);

  const { error, data, status, statusText } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", input.userId)
    .select("id, full_name, color");

  console.error("[updateProfile] Database response:", {
    status,
    statusText,
    error: error?.message || error,
    dataCount: data?.length,
    data,
  });

  if (error) {
    console.error("[updateProfile] Update failed:", error);
    return { error: `Failed to update: ${error.message}` };
  }

  if (!data || data.length === 0) {
    console.error("[updateProfile] No rows updated - profile ID may not exist");
    return { error: "Profile not found or no changes made" };
  }

  console.error("[updateProfile] Update successful");
  revalidatePath("/manager");
  return { success: "Profile updated." };
}
