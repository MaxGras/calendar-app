"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"

type ActionResult = { error?: string; success?: string }

export async function bookCall(input: {
  developerId: string
  title: string
  notes: string
  startISO: string
  endISO: string
}): Promise<ActionResult> {
  const profile = await getCurrentProfile()
  if (!profile || !["admin", "sales_manager"].includes(profile.role)) {
    return { error: "Not authorized." }
  }

  const start = new Date(input.startISO)
  const end = new Date(input.endISO)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Invalid time." }
  if (end <= start) return { error: "End time must be after the start time." }
  if (start < new Date()) return { error: "Cannot book a call in the past." }

  const supabase = await createClient()

  const { error } = await supabase.from("calls").insert({
    developer_id: input.developerId,
    created_by: profile.id,
    title: input.title.trim() || "Call",
    notes: input.notes.trim(),
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  })

  if (error) {
    // 23P01 = exclusion_violation (overlap). Surface a clear message.
    if (error.code === "23P01" || /overlap|exclu/i.test(error.message)) {
      return { error: "That developer is already booked during this time. Pick another slot." }
    }
    return { error: error.message }
  }

  revalidatePath("/manager")
  return { success: "Call scheduled." }
}

export async function cancelCall(callId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile()
  if (!profile || !["admin", "sales_manager"].includes(profile.role)) {
    return { error: "Not authorized." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("calls").delete().eq("id", callId)
  if (error) return { error: error.message }

  revalidatePath("/manager")
  return { success: "Call cancelled." }
}
