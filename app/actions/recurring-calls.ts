"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function checkOverlap(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  existingStartHour: number,
  existingStartMinute: number,
  existingEndHour: number,
  existingEndMinute: number,
): boolean {
  const newStartMinutes = startHour * 60 + startMinute
  const newEndMinutes = endHour * 60 + endMinute
  const existingStartMinutes = existingStartHour * 60 + existingStartMinute
  const existingEndMinutes = existingEndHour * 60 + existingEndMinute

  return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes
}

export async function createRecurringCall({
  title,
  callLink,
  salesManagerId,
  repeatType,
  repeatDays,
  repeatInterval,
  hour,
  minute,
  durationMinutes = 60,
}: {
  title: string
  callLink: string
  salesManagerId: string | null
  repeatType: string
  repeatDays: string[]
  repeatInterval: string
  hour: number
  minute: number
  durationMinutes?: number
}): Promise<{ error?: string; success?: string }> {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== "developer") {
      return { error: "Unauthorized" }
    }

    const supabase = await createClient()

    // Fetch existing calls for this developer
    const { data: existingCalls } = await supabase
      .from("calls")
      .select("*")
      .eq("developer_id", profile.id)

    // Fetch existing recurring calls for this developer
    const { data: existingRecurringCalls } = await supabase
      .from("recurring_calls")
      .select("*")
      .eq("developer_id", profile.id)
      .eq("is_active", true)

    const calls = existingCalls || []
    const recurringCalls = existingRecurringCalls || []

    // Calculate end time based on duration
    const totalMinutes = hour * 60 + minute + durationMinutes
    const endHour = Math.floor(totalMinutes / 60)
    const endMinute = totalMinutes % 60

    // Determine which days this recurring call applies to
    const applicableDays =
      repeatType === "daily"
        ? DAYS_SHORT
        : repeatType === "weekly" || repeatType === "biweekly" || repeatType === "custom"
          ? repeatDays
          : []

    // Check for overlaps with existing one-time calls
    for (const call of calls) {
      const callStart = new Date(call.start_time)
      const callEnd = new Date(call.end_time)
      const callDayIndex = callStart.getDay()
      const callDayName = DAYS_SHORT[callDayIndex]

      if (applicableDays.includes(callDayName)) {
        if (checkOverlap(hour, minute, endHour, endMinute, callStart.getHours(), callStart.getMinutes(), callEnd.getHours(), callEnd.getMinutes())) {
          return {
            error: `Time slot overlaps with existing call "${call.title}" on ${callDayName}s at ${callStart.getHours().toString().padStart(2, "0")}:${callStart.getMinutes().toString().padStart(2, "0")}`,
          }
        }
      }
    }

    // Check for overlaps with existing recurring calls
    for (const existing of recurringCalls) {
      const existingApplicableDays =
        existing.repeat_type === "daily"
          ? DAYS_SHORT
          : existing.repeat_type === "weekly" ||
              existing.repeat_type === "biweekly" ||
              existing.repeat_type === "custom"
            ? existing.repeat_days || []
            : []

      const overlappingDays = applicableDays.filter((day) => existingApplicableDays.includes(day))

      if (overlappingDays.length > 0) {
        if (
          checkOverlap(
            hour,
            minute,
            endHour,
            endMinute,
            existing.hour,
            existing.minute,
            existing.hour + 1,
            existing.minute,
          )
        ) {
          return {
            error: `Time slot overlaps with existing recurring call "${existing.title}" on ${overlappingDays.join(", ")}`,
          }
        }
      }
    }

    const { data, error } = await supabase.from("recurring_calls").insert({
      developer_id: profile.id,
      sales_manager_id: salesManagerId,
      title,
      call_link: callLink,
      repeat_type: repeatType,
      repeat_days: repeatDays.length > 0 ? repeatDays : null,
      repeat_interval: repeatInterval,
      hour,
      minute,
      duration_minutes: durationMinutes,
      is_active: true,
    }).select()

    if (error) {
      console.error("Error creating recurring call:", error)
      return { error: "Failed to create recurring call" }
    }

    return { success: "Recurring call created successfully", data: data?.[0] }
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

export async function cancelRecurringCallInstance(
  recurringCallId: string,
  date: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== "developer") {
      return { error: "Unauthorized" }
    }

    const supabase = await createClient()

    // Verify the recurring call belongs to the developer
    const { data: recurringCall } = await supabase
      .from("recurring_calls")
      .select("id")
      .eq("id", recurringCallId)
      .eq("developer_id", profile.id)
      .single()

    if (!recurringCall) {
      return { error: "Recurring call not found" }
    }

    // Add exception for this date
    const { error } = await supabase.from("recurring_call_exceptions").insert({
      recurring_call_id: recurringCallId,
      exception_date: date,
      reason: "Canceled by developer",
    })

    if (error) {
      console.error("Error canceling instance:", error)
      return { error: "Failed to cancel this instance" }
    }

    return { success: "Call canceled for this date" }
  } catch (err) {
    console.error("Error:", err)
    return { error: "An error occurred" }
  }
}
