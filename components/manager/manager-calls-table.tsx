"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Trash2 } from "lucide-react"
import type { CallWithDeveloper } from "@/lib/types"
import { formatDateTime } from "@/lib/time"

interface ManagerCallsTableProps {
  calls: CallWithDeveloper[]
}

export function ManagerCallsTable({ calls }: ManagerCallsTableProps) {
  const columns: ColumnDef<CallWithDeveloper>[] = [
    {
      accessorKey: "developer.full_name",
      header: "Developer",
      cell: ({ row }) => {
        const call = row.original
        return <div className="font-medium">{call.developer?.full_name || "Unknown"}</div>
      },
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "start_time",
      header: "Date & Time",
      cell: ({ row }) => {
        const call = row.original
        const start = new Date(call.start_time)
        return <div className="text-sm">{formatDateTime(start)}</div>
      },
    },
    {
      accessorKey: "end_time",
      header: "Duration",
      cell: ({ row }) => {
        const call = row.original
        const start = new Date(call.start_time)
        const end = new Date(call.end_time)
        const durationMinutes = (end.getTime() - start.getTime()) / 60_000
        const hours = Math.floor(durationMinutes / 60)
        const minutes = durationMinutes % 60
        const durationText =
          hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}` : `${minutes}m`
        return <div className="text-sm text-muted-foreground">{durationText}</div>
      },
    },
    {
      accessorKey: "call_link",
      header: "Call Link",
      cell: ({ row }) => {
        const callLink = row.getValue("call_link") as string
        return callLink ? (
          <div className="max-w-xs truncate text-sm text-muted-foreground">{callLink}</div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          disabled
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  if (calls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No calls scheduled yet</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={calls} />
}
