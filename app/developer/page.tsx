import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard-shell"
import type { CallWithDeveloper } from "@/lib/types"
import { formatDateTime } from "@/lib/time"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

export default async function DeveloperPage() {
  const profile = await requireRole(["developer"])
  const supabase = await createClient()

  // Fetch all calls for this developer
  const { data: callsData } = await supabase
    .from("calls")
    .select("*")
    .eq("developer_id", profile.id)
    .order("start_time", { ascending: true })

  const calls = (callsData as CallWithDeveloper[]) ?? []

  const now = new Date()
  const upcomingCalls = calls.filter((c) => new Date(c.end_time) > now)
  const pastCalls = calls.filter((c) => new Date(c.end_time) <= now)

  return (
    <DashboardShell
      profile={profile}
      title="Your schedule"
      description="View all your scheduled calls."
    >
      <div className="flex flex-col gap-6">
        {/* Upcoming calls */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
            <p className="text-sm text-muted-foreground">
              {upcomingCalls.length} call{upcomingCalls.length !== 1 ? "s" : ""}
            </p>
          </div>

          {upcomingCalls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">No upcoming calls</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  You're all set. Your schedule is clear.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {upcomingCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          )}
        </div>

        {/* Past calls */}
        {pastCalls.length > 0 ? (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Past</h2>
              <p className="text-sm text-muted-foreground">
                {pastCalls.length} call{pastCalls.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-3">
              {pastCalls.map((call) => (
                <CallCard key={call.id} call={call} isPast />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  )
}

function CallCard({ call, isPast = false }: { call: CallWithDeveloper; isPast?: boolean }) {
  const start = new Date(call.start_time)
  const end = new Date(call.end_time)

  return (
    <Card className={isPast ? "opacity-60" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{call.title}</CardTitle>
            <CardDescription className="mt-1">
              {formatDateTime(start)} – {end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </CardDescription>
          </div>
          {isPast ? <Badge variant="secondary">Past</Badge> : null}
        </div>
      </CardHeader>
      {call.notes ? (
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{call.notes}</p>
        </CardContent>
      ) : null}
    </Card>
  )
}
