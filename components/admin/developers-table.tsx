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

interface DevelopersTableProps {
  developers: Profile[]
}

export function DevelopersTable({ developers }: DevelopersTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (developers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">No developers created yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border ">
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
          {developers.map((dev) => (
            <TableRow key={dev.id}>
              <TableCell className="font-medium">{dev.full_name}</TableCell>
              <TableCell className="text-gray-600">{dev.email}</TableCell>
              <TableCell>
                <Badge variant={dev.is_active ? "default" : "secondary"}>
                  {dev.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(dev.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
