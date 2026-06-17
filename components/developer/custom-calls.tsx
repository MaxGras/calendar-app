"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CustomCallsForm } from "./custom-calls-form"
import { CustomCallsList } from "./custom-calls-list"
import type { Profile } from "@/lib/types"

export function CustomCalls({
  salesManagers,
  recurringCalls,
  currentProfile,
}: {
  salesManagers: Profile[]
  recurringCalls: any[]
  currentProfile: Profile
}) {
  const [activeSubTab, setActiveSubTab] = useState("setup")

  const subTabs = [
    { id: "setup", label: "Setup", icon: "⚙️" },
    { id: "list", label: "My Recurring Calls", icon: "📋" },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-all border-b-2",
              activeSubTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="flex-1">
        {activeSubTab === "setup" && (
          <CustomCallsForm salesManagers={salesManagers} currentProfile={currentProfile} />
        )}
        {activeSubTab === "list" && <CustomCallsList calls={recurringCalls} />}
      </div>
    </div>
  )
}
