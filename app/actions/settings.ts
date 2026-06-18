"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentProfile } from "@/lib/auth"

type ActionResult = { error?: string; success?: string }

export async function getDefaultTimezone(): Promise<string> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "default_timezone")
      .single()

    if (error || !data) {
      return "Europe/Kyiv" // Default fallback
    }

    return data.value
  } catch (err) {
    console.error("Error fetching timezone:", err)
    return "Europe/Kyiv"
  }
}

export async function updateDefaultTimezone(timezone: string): Promise<ActionResult> {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized" }
  }

  // Validate timezone is a valid IANA timezone
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone })
  } catch (err) {
    return { error: "Invalid timezone" }
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("app_settings")
    .upsert({
      key: "default_timezone",
      value: timezone,
      updated_by: profile.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: `Timezone updated to ${timezone}` }
}
