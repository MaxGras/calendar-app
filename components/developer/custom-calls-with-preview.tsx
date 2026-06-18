"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CustomCallsForm, type RecurringCallFormState } from "./custom-calls-form"
import { CustomCallsList } from "./custom-calls-list"
import { RecurringCallsPreview } from "./recurring-calls-preview"
import type { Profile } from "@/lib/types"

export function CustomCallsWithPreview({
  salesManagers,
  recurringCalls,
  currentProfile,
}: {
  salesManagers: Profile[]
  recurringCalls: any[]
  currentProfile: Profile
}) {
  const [activeSubTab, setActiveSubTab] = useState("setup")
  const [localRecurringCalls, setLocalRecurringCalls] = useState(recurringCalls)
  const [formState, setFormState] = useState<RecurringCallFormState | null>(null)

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
      {activeSubTab === "setup" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Setup form */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Create Recurring Call</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up a recurring call template. You'll see a preview on the right.
              </p>
            </div>
            <CustomCallsForm
              salesManagers={salesManagers}
              currentProfile={currentProfile}
              onCallCreated={(newCall) => {
                if (newCall) {
                  setLocalRecurringCalls([newCall, ...localRecurringCalls])
                  setFormState(null)
                }
              }}
              onFormChange={setFormState}
            />
          </div>

          {/* Right side: Calendar preview */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Calendar Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                See how your recurring calls will appear on the calendar.
              </p>
            </div>
            <RecurringCallsPreview recurringCalls={localRecurringCalls} formState={formState} />
          </div>
        </div>
      ) : (
        <CustomCallsList calls={localRecurringCalls} />
      )}
    </div>
  )
}
