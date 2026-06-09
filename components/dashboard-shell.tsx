import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";

export function DashboardShell({
  profile,
  title,
  description,
  actions,
  children,
  fullWidth,
  wideLayout,
}: {
  profile: Profile;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
  wideLayout?: boolean;
}) {
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="flex w-full justify-center">
          <div className="flex max-w-6xl w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
                <p className="text-sm font-medium leading-tight text-foreground">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">{profile.email}</p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <div
          className={`sm:px-6 sm:py-8 flex flex-col flex-1 overflow-y-auto ${fullWidth ? "w-full" : "max-w-6xl w-full"} ${wideLayout ? "w-[75vw]" : ""}`}
        >
          {title && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
              </div>
              {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
