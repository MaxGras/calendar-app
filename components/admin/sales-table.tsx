"use client"

import { useState, useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { AddUserDialog } from "./add-user-dialog"
import { deleteAccount } from "@/app/actions/admin"
import type { Profile } from "@/lib/types"

interface SalesTableProps {
  managers: Profile[]
}

export function SalesTable({ managers }: SalesTableProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  })
  const [pending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteAccount(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success || "Sales manager deleted")
        setDeleteConfirm({ open: false, id: "", name: "" })
      }
    })
  }

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
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setDeleteConfirm({
              open: true,
              id: row.original.id,
              name: row.original.full_name || row.original.email,
            })
          }
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Sales Managers</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sales Manager
        </Button>
      </div>

      {managers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No sales managers created yet</p>
          <Button variant="outline" onClick={() => setAddDialogOpen(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create First Sales Manager
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={managers} />
      )}

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        role="sales_manager"
      />

      {/* Delete confirmation dialog */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-6 max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Delete Sales Manager</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm({ open: false, id: "", name: "" })}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={pending}
              >
                {pending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
