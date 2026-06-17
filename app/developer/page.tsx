import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { DeveloperLayout } from "@/components/developer/developer-layout"
import type { CallWithDeveloper, Profile } from "@/lib/types"

export default async function DeveloperPage() {
  const profile = await requireRole(["developer"])
  const supabase = await createClient()

  // Fetch all calls for this developer with creator info
  const { data: callsData } = await supabase
    .from("calls")
    .select("*, developer:profiles!calls_developer_id_fkey(id, full_name, email), creator:profiles!calls_created_by_fkey(id, full_name, email, color)")
    .eq("developer_id", profile.id)
    .order("start_time", { ascending: true })

  const calls = (callsData as CallWithDeveloper[]) ?? []

  // Fetch all sales managers for the form
  const { data: salesManagersData } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "sales_manager")
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  const salesManagers = (salesManagersData as Profile[]) ?? []

  // Fetch recurring calls for this developer
  const { data: recurringCallsData } = await supabase
    .from("recurring_calls")
    .select("*, sales_manager:profiles!recurring_calls_sales_manager_id_fkey(id, full_name, email, color)")
    .eq("developer_id", profile.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const recurringCalls = recurringCallsData ?? []

  return (
    <DashboardShell
      profile={profile}
      fullWidth
      wideLayout
    >
      <DeveloperLayout
        calls={calls}
        profile={profile}
        salesManagers={salesManagers}
        recurringCalls={recurringCalls}
      />
    </DashboardShell>
  )
}
