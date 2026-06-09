import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { ManagerLayout } from "@/components/manager/manager-layout"
import type { CallWithDeveloper, Profile } from "@/lib/types"

export default async function ManagerPage() {
  const profile = await requireRole(["admin", "sales_manager"])
  const supabase = await createClient()

  const { data: developersData } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "developer")
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  const developers = (developersData as Profile[]) ?? []

  // Fetch upcoming calls (from start of today) with developer info
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { data: callsData } = await supabase
    .from("calls")
    .select("*, developer:profiles!calls_developer_id_fkey(id, full_name, email), creator:profiles!calls_created_by_fkey(id, full_name, email)")
    .gte("end_time", startOfToday.toISOString())
    .order("start_time", { ascending: true })

  const calls = (callsData as CallWithDeveloper[]) ?? []

  return (
    <DashboardShell
      profile={profile}
      fullWidth
      wideLayout
    >
      <ManagerLayout developers={developers} calls={calls} profile={profile} />
    </DashboardShell>
  )
}
