"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentProfile } from "@/lib/auth"
import type { Role } from "@/lib/types"

type ActionResult = { error?: string; success?: string }

async function assertAdmin() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    return null
  }
  return profile
}

export async function createAccount(formData: FormData): Promise<ActionResult> {
  const admin = await assertAdmin()
  if (!admin) return { error: "Not authorized." }

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const fullName = String(formData.get("full_name") || "").trim()
  const role = String(formData.get("role") || "") as Role

  if (!email || !password || !fullName) return { error: "All fields are required." }
  if (password.length < 8) return { error: "Password must be at least 8 characters." }
  if (!["sales_manager", "developer", "admin"].includes(role)) return { error: "Invalid role." }

  const supabase = await createAdminClient()

  // Create the auth user (email pre-confirmed so they can sign in immediately)
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createErr || !created.user) {
    return { error: createErr?.message ?? "Failed to create user." }
  }

  // Create the profile row (service role bypasses RLS)
  const { error: profileErr } = await supabase.from("profiles").insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role,
    is_active: true,
  })

  if (profileErr) {
    // Roll back the auth user so we don't leave an orphan
    await supabase.auth.admin.deleteUser(created.user.id)
    return { error: profileErr.message }
  }

  revalidatePath("/admin")
  return { success: `Created ${fullName}.` }
}

export async function setAccountActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const admin = await assertAdmin()
  if (!admin) return { error: "Not authorized." }
  if (userId === admin.id) return { error: "You cannot deactivate your own account." }

  const supabase = await createAdminClient()
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId)
  if (error) return { error: error.message }

  // Also ban/unban at the auth layer so deactivated users can't sign in
  await supabase.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? "none" : "876000h",
  })

  revalidatePath("/admin")
  return { success: isActive ? "Account activated." : "Account deactivated." }
}

export async function deleteAccount(userId: string): Promise<ActionResult> {
  const admin = await assertAdmin()
  if (!admin) return { error: "Not authorized." }
  if (userId === admin.id) return { error: "You cannot delete your own account." }

  const supabase = await createAdminClient()
  // Deleting the auth user cascades to the profile (FK on delete cascade)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { success: "Account deleted." }
}

export async function updateAccountRole(userId: string, role: Role): Promise<ActionResult> {
  const admin = await assertAdmin()
  if (!admin) return { error: "Not authorized." }
  if (userId === admin.id) return { error: "You cannot change your own role." }

  const supabase = await createAdminClient()
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { success: "Role updated." }
}
