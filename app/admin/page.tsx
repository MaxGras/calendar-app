import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminLayout } from "@/components/admin/admin-layout";
import type { Profile } from "@/lib/types";

export default async function AdminPage() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: accounts } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

  const list = (accounts as Profile[]) ?? [];

  return (
    <DashboardShell profile={profile} fullWidth>
      <AdminLayout
        accounts={list}
        currentUserId={profile.id}
        title="Account management"
        description="Manage developers and sales managers."
      />
    </DashboardShell>
  );
}
 