"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { AddUserDialog } from "./add-user-dialog"
import type { Profile } from "@/lib/types"

interface DevelopersTableProps {
  developers: Profile[]
}

export function DevelopersTable({ developers }: DevelopersTableProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("full_name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active")
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue("created_at"))}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Developers</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Developer
        </Button>
      </div>

      {developers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No developers created yet</p>
          <Button variant="outline" onClick={() => setAddDialogOpen(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create First Developer
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={developers} />
      )}

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        role="developer"
      />
    </>
  )
}
