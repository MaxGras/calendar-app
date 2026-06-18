"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SchedulerBoard } from "./scheduler-board";
import { ManagerCallsTable } from "./manager-calls-table";
import { ManagerProfile } from "./manager-profile";
import type { CallWithDeveloper, Profile } from "@/lib/types";

interface ManagerLayoutProps {
  developers: Profile[];
  calls: CallWithDeveloper[];
  profile: Profile;
  recurringCalls?: any[];
}

export function ManagerLayout({ developers, calls, profile, recurringCalls = [] }: ManagerLayoutProps) {
  const [activeTab, setActiveTab] = useState("calendar");

  const managerCalls = calls.filter((c) => c.created_by === profile.id || profile.role === "admin");

  const menuItems = [
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "calls", label: "Calls", icon: "📋" },
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
            <SchedulerBoard developers={developers} calls={calls} recurringCalls={recurringCalls} currentProfile={profile} />
          )}
          {activeTab === "calls" && <ManagerCallsTable calls={managerCalls} />}
          {activeTab === "profile" && <ManagerProfile profile={profile} />}
        </div>
      </main>
    </div>
  );
}
