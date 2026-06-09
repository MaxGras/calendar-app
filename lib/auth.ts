import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Role } from "@/lib/types"

// Returns the signed-in user's profile, or null if not signed in.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  return (data as Profile) ?? null
}

// Requires a signed-in user with one of the allowed roles, otherwise redirects.
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/auth/login")
  if (!profile.is_active) redirect("/auth/login?error=inactive")
  if (!allowed.includes(profile.role)) {
    // Send users to their own dashboard rather than an error
    redirect(profile.role === "admin" ? "/admin" : profile.role === "sales_manager" ? "/manager" : "/developer")
  }
  return profile
}
