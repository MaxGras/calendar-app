"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DeveloperSchedulerBoard } from "./developer-scheduler-board";
import { DeveloperCallsTable } from "./developer-calls-table";
import { CustomCallsWithPreview } from "./custom-calls-with-preview";
import { ManagerProfile } from "@/components/manager/manager-profile";
import type { CallWithDeveloper, Profile } from "@/lib/types";

interface DeveloperLayoutProps {
  calls: CallWithDeveloper[];
  profile: Profile;
  salesManagers: Profile[];
  recurringCalls: any[];
}

export function DeveloperLayout({ calls, profile, salesManagers, recurringCalls }: DeveloperLayoutProps) {
  const [activeTab, setActiveTab] = useState("calendar");

  const menuItems = [
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "calls", label: "My Calls", icon: "📋" },
    { id: "custom-calls", label: "Custom Calls", icon: "🔄" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="flex gap-6 flex-1 px-4 py-3">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 rounded-lg border border-border bg-card">
        <nav className="space-y-1 p-4 h-full flex flex-col">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-md font-medium text-sm transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="flex-1" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {activeTab === "calendar" && (
            <DeveloperSchedulerBoard calls={calls} currentProfile={profile} recurringCalls={recurringCalls} />
          )}
          {activeTab === "calls" && <DeveloperCallsTable calls={calls} currentProfile={profile} />}
          {activeTab === "custom-calls" && (
            <CustomCallsWithPreview
              salesManagers={salesManagers}
              recurringCalls={recurringCalls}
              currentProfile={profile}
            />
          )}
          {activeTab === "profile" && <ManagerProfile profile={profile} />}
        </div>
      </main>
    </div>
  );
}
