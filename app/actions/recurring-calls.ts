"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"

export async function createRecurringCall({
  title,
  callLink,
  salesManagerId,
  repeatType,
  repeatDays,
  repeatInterval,
  hour,
  minute,
}: {
  title: string
  callLink: string
  salesManagerId: string | null
  repeatType: string
  repeatDays: string[]
  repeatInterval: string
  hour: number
  minute: number
}): Promise<{ error?: string; success?: string }> {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== "developer") {
      return { error: "Unauthorized" }
    }

    const supabase = await createClient()

    const { error } = await supabase.from("recurring_calls").insert({
      developer_id: profile.id,
      sales_manager_id: salesManagerId,
      title,
      call_link: callLink,
      repeat_type: repeatType,
      repeat_days: repeatDays.length > 0 ? repeatDays : null,
      repeat_interval: repeatInterval,
      hour,
      minute,
      is_active: true,
    })

    if (error) {
      console.error("Error creating recurring call:", error)
      return { error: "Failed to create recurring call" }
    }

    return { success: "Recurring call created successfully" }
  } catch (err) {
    console.error("Error:", err)
    return { error: "An error occurred" }
  }
}

export async function getRecurringCalls(): Promise<any[]> {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== "developer") {
      return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("recurring_calls")
      .select("*, sales_manager:profiles!recurring_calls_sales_manager_id_fkey(id, full_name, email, color)")
      .eq("developer_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching recurring calls:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Error:", err)
    return []
  }
}

export async function deleteRecurringCall(id: string): Promise<{ error?: string; success?: string }> {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== "developer") {
      return { error: "Unauthorized" }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("recurring_calls")
      .delete()
      .eq("id", id)
      .eq("developer_id", profile.id)

    if (error) {
      console.error("Error deleting recurring call:", error)
      return { error: "Failed to delete recurring call" }
    }

    return { success: "Recurring call deleted" }
  } catch (err) {
    console.error("Error:", err)
    return { error: "An error occurred" }
  }
}
