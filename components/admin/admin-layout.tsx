"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DevelopersTable } from "./developers-table";
import { SalesTable } from "./sales-table";
import type { Profile } from "@/lib/types";

interface AdminLayoutProps {
  accounts: Profile[];
  currentUserId: string;
  title: string;
  description?: string;
}

export function AdminLayout({ accounts, currentUserId, title, description }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState("developers");

  const developers = accounts.filter((a) => a.role === "developer");
  const salesManagers = accounts.filter((a) => a.role === "sales_manager");

  const menuItems = [
    { id: "developers", label: "Developers", icon: "👨‍💻" },
    { id: "sales", label: "Sales Managers", icon: "📈" },
    { id: "availability", label: "Availability", icon: "📅" },
  ];

  return (
    <div className="flex gap-6 flex-1">
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        </div>

        <div className="flex-1">
          {activeTab === "developers" && <DevelopersTable developers={developers} />}
          {activeTab === "sales" && <SalesTable managers={salesManagers} />}
          {activeTab === "availability" && (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">Availability tracking coming soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
