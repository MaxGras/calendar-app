"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Profile } from "@/lib/types"

interface SalesTableProps {
  managers: Profile[]
}

export function SalesTable({ managers }: SalesTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (managers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">No sales managers created yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {managers.map((manager) => (
            <TableRow key={manager.id}>
              <TableCell className="font-medium">{manager.full_name}</TableCell>
              <TableCell className="text-gray-600">{manager.email}</TableCell>
              <TableCell>
                <Badge variant={manager.is_active ? "default" : "secondary"}>
                  {manager.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(manager.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
