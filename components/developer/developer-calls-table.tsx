"use client"

import { useMemo, useState } from "react"
import type { CallWithDeveloper, Profile } from "@/lib/types"
import { formatTime } from "@/lib/time"
import { getContrastTextColor } from "@/lib/color"
import { Card, CardContent } from "@/components/ui/card"
import { CallDetailsDialog } from "@/components/manager/call-details-dialog"

interface DeveloperCallsTableProps {
  calls: CallWithDeveloper[]
  currentProfile: Profile
}

export function DeveloperCallsTable({ calls, currentProfile }: DeveloperCallsTableProps) {
  const [selectedCall, setSelectedCall] = useState<CallWithDeveloper | null>(null)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const oneWeekFromNow = new Date(today)
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

  const upcomingCalls = useMemo(() => {
    return calls.filter((call) => new Date(call.start_time) >= today && new Date(call.start_time) < oneWeekFromNow)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [calls])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, CallWithDeveloper[]> = {}

    upcomingCalls.forEach((call) => {
      const callDate = new Date(call.start_time)
      const dateKey = callDate.toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(call)
    })

    return groups
  }, [upcomingCalls])

  if (upcomingCalls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No calls scheduled for the next 7 days</p>
      </div>
    )
  }

  const formatDateLabel = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00')
    const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0]

    if (isToday) {
      return "Today"
    }

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {Object.entries(groupedByDate).map(([dateString, dateCalls]) => (
          <div key={dateString}>
            <span className="text-sm font-semibold text-foreground mb-3 block">
              {formatDateLabel(dateString)}
            </span>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {dateCalls.map((call) => {
                    const start = new Date(call.start_time)
                    const end = new Date(call.end_time)
                    const durationMinutes = (end.getTime() - start.getTime()) / 60_000
                    const hours = Math.floor(durationMinutes / 60)
                    const minutes = durationMinutes % 60
                    const durationText =
                      hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}` : `${minutes}m`

                    return (
                      <button
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className="w-full text-left flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{call.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="text-xs font-medium px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: call.creator?.color || "#8B5CF6",
                                color: getContrastTextColor(call.creator?.color || "#8B5CF6"),
                              }}
                            >
                              {call.creator?.full_name || call.creator?.email || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {durationText}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-foreground">
                            {formatTime(start)} – {formatTime(end)}
                          </p>
                          {call.call_link && (
                            <a
                              href={call.call_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              Link
                            </a>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {selectedCall && (
        <CallDetailsDialog
          call={selectedCall}
          currentProfile={currentProfile}
          onClose={() => setSelectedCall(null)}
          onCancelled={() => setSelectedCall(null)}
          readOnly
        />
      )}
    </>
  )
}
