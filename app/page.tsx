import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth"
import { dashboardPathForRole } from "@/lib/types"

export default async function Home() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/auth/login")
  redirect(dashboardPathForRole(profile.role))
}
