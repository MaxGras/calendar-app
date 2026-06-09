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
    <div className="flex gap-6 h-full flex-1">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 rounded-lg border bg-gray-50">
        <nav className="space-y-2 p-6 h-full flex flex-col">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-md font-medium transition-colors",
                activeTab === item.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100",
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
      <main className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>

        {activeTab === "developers" && <DevelopersTable developers={developers} />}
        {activeTab === "sales" && <SalesTable managers={salesManagers} />}
        {activeTab === "availability" && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">Availability tracking coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}
