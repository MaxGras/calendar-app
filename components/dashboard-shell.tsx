import type { ReactNode } from "react"
import { CalendarClock } from "lucide-react"
import type { Profile } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { SignOutButton } from "@/components/sign-out-button"

export function DashboardShell({
  profile,
 
  description,
  actions,
  children,
  fullWidth,
}: {
  profile: Profile
 
  description?: string
  actions?: ReactNode
  children: ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarClock className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">CallDesk</span>
            <Badge variant="secondary" className="ml-1 font-normal">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{profile.full_name || profile.email}</p>
              <p className="text-xs leading-tight text-muted-foreground">{profile.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className={`px-4 py-6 sm:px-6 sm:py-8 ${fullWidth ? "" : "mx-auto max-w-6xl"}`}>
        {children}
      </main>
    </div>
  )
}
