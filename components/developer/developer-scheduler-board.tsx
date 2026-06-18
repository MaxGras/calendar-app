"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import type { CallWithDeveloper, Profile } from "@/lib/types"
import { getContrastTextColor } from "@/lib/color"
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  addDays,
  formatTime,
  sameDay,
  startOfWeek,
} from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CallDetailsDialog } from "@/components/manager/call-details-dialog"
import { DeleteRecurringCallModal } from "./delete-recurring-call-modal"

// Generate 30-minute slots
const SLOTS = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * 2 },
  (_, i) => DAY_START_HOUR + i * 0.5
)
const SLOT_HEIGHT = 32 // px per 30-minute slot

export function DeveloperSchedulerBoard({
  calls: initialCalls,
  currentProfile,
  recurringCalls = [],
}: {
  calls: CallWithDeveloper[]
  currentProfile: Profile
  recurringCalls?: any[]
}) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [selectedCall, setSelectedCall] = useState<CallWithDeveloper | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; callId: string; callTitle: string; instanceDate?: string }>({
    open: false,
    callId: "",
    callTitle: "",
  })

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  // Generate call instances from recurring calls for this week
  const generatedCalls = useMemo(() => {
    const instances: CallWithDeveloper[] = []

    recurringCalls.forEach((recurring) => {
      days.forEach((day) => {
        const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]
        const shouldInclude =
          recurring.repeat_type === "daily" ||
          (recurring.repeat_type === "weekly" && recurring.repeat_days?.includes(dayOfWeek)) ||
          (recurring.repeat_type === "biweekly" && recurring.repeat_days?.includes(dayOfWeek)) ||
          (recurring.repeat_type === "custom" && recurring.repeat_days?.includes(dayOfWeek))

        if (shouldInclude) {
          const start = new Date(day)
          start.setHours(recurring.hour, recurring.minute, 0, 0)

          const end = new Date(start)
          end.setMinutes(end.getMinutes() + (recurring.duration_minutes || 60))

          instances.push({
            id: `${recurring.id}-${day.toISOString()}`,
            developer_id: recurring.developer_id,
            title: recurring.title,
            call_link: recurring.call_link,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            created_by: currentProfile.id,
            created_at: recurring.created_at,
            updated_at: recurring.updated_at,
            developer: { id: recurring.developer_id, full_name: "", email: "" },
            creator: recurring.sales_manager || { id: currentProfile.id, full_name: currentProfile.full_name, email: currentProfile.email, color: currentProfile.color },
            isRecurringInstance: true,
            recurringCallId: recurring.id,
            instanceDate: day.toISOString().split("T")[0],
          } as any)
        }
      })
    })

    return instances
  }, [recurringCalls, days, currentProfile])

  const allCalls = useMemo(() => [...initialCalls, ...generatedCalls], [initialCalls, generatedCalls])

  if (allCalls.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No scheduled calls</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            You don't have any scheduled calls yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDateCompact = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.getMonth()]} ${date.getDate()}`
  }
  const weekLabel = `${formatDateCompact(days[0])} – ${formatDateCompact(days[6])} ${days[6].getFullYear()}`
  const now = new Date()

  // Calculate current time position for the indicator line
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
  const startTimeMinutes = DAY_START_HOUR * 60
  const currentTimeOffset = ((currentTimeMinutes - startTimeMinutes) / 30) * SLOT_HEIGHT

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <div className="flex items-center rounded-md border border-border bg-card">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous week</span>
            </Button>
            <span className="min-w-[180px] px-2 text-center text-sm font-medium text-foreground">{weekLabel}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next week</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden border border-border bg-card p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day headers */}
            <div className="sticky top-0 z-10 grid grid-cols-[80px_repeat(7,1fr)] border-b-2 border-border bg-secondary/50 backdrop-blur-sm">
              <div className="border-r border-border" />
              {days.map((day) => {
                const isToday = sameDay(day, now)
                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-border px-3 py-3 text-center last:border-r-0 ${isToday ? "bg-accent/10" : ""}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}
                    </p>
                    <p
                      className={
                        "mt-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold " +
                        (isToday ? "bg-primary text-primary-foreground" : "text-foreground")
                      }
                    >
                      {day.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)]">
              {/* Time slot labels */}
              <div className="border-r border-border bg-muted/20">
                {SLOTS.map((slot) => {
                  const isHourStart = slot % 1 === 0
                  return (
                    <div
                      key={slot}
                      className={`relative border-b border-border/50 px-2 py-0.5 ${!isHourStart ? "bg-muted/5" : ""}`}
                      style={{ height: SLOT_HEIGHT }}
                    >
                      {isHourStart && (
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                          {formatHour(slot)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Day columns */}
              {days.map((day) => (
                <DeveloperDayColumn
                  key={day.toISOString()}
                  day={day}
                  calls={allCalls}
                  now={now}
                  onCallClick={(call) => setSelectedCall(call)}
                  currentTimeOffset={sameDay(day, now) ? currentTimeOffset : -1}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Times shown in your local timezone.
      </p>

      {selectedCall ? (
        <CallDetailsDialog
          call={selectedCall}
          currentProfile={currentProfile}
          onClose={() => setSelectedCall(null)}
          onCancelled={() => {
            setSelectedCall(null)
          }}
          readOnly
        />
      ) : null}

      <DeleteRecurringCallModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}
        recurringCallId={deleteModal.callId}
        recurringCallTitle={deleteModal.callTitle}
        instanceDate={deleteModal.instanceDate}
        onSuccess={() => {
          // Remove the deleted instance from the calendar view
          setWeekStart(new Date(weekStart))
        }}
      />
    </div>
  )
}

function DeveloperDayColumn({
  day,
  calls,
  now,
  onCallClick,
  currentTimeOffset,
}: {
  day: Date
  calls: CallWithDeveloper[]
  now: Date
  onCallClick: (call: CallWithDeveloper) => void
  currentTimeOffset: number
}) {
  const dayCalls = calls.filter((c) => sameDay(new Date(c.start_time), day))

  return (
    <div className="relative border-r border-border/50 last:border-r-0">
      {SLOTS.map((slot) => {
        const slotStart = new Date(day)
        const hours = Math.floor(slot)
        const minutes = (slot % 1) * 60
        slotStart.setHours(hours, minutes, 0, 0)
        const isPast = slotStart < now
        const isHalfHour = slot % 1 === 0.5
        return (
          <div
            key={slot}
            className={
              "relative block w-full border-b border-border/50 " +
              (isPast ? "bg-muted/35" : "") +
              (isHalfHour && !isPast ? " bg-muted/5" : "")
            }
            style={{ height: SLOT_HEIGHT }}
          />
        )
      })}

      {/* Current time indicator line */}
      {currentTimeOffset >= 0 && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
          style={{
            top: `${currentTimeOffset}px`,
            boxShadow: "0 0 4px rgba(239, 68, 68, 0.8)",
          }}
        />
      )}

      {/* Booked calls overlaid */}
      {dayCalls.map((call) => {
        const start = new Date(call.start_time)
        const end = new Date(call.end_time)
        const isPast = end <= now

        // Calculate position in 30-minute slots
        const startTotalMinutes = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
        const startSlotNumber = startTotalMinutes / 30
        const startOffset = startSlotNumber * SLOT_HEIGHT

        // Calculate height in 30-minute slots
        const durationMinutes = (end.getTime() - start.getTime()) / 60_000
        const durationSlots = durationMinutes / 30
        const height = Math.max(durationSlots * SLOT_HEIGHT, 32)

        const isRecurring = (call as any).isRecurringInstance

        const baseColor = call.creator?.color || "#8B5CF6"

        return (
          <button
            key={call.id}
            type="button"
            onClick={() => onCallClick(call)}
            className={`absolute inset-x-2 overflow-hidden rounded-lg border-2 px-2 py-1.5 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 cursor-pointer ${isPast ? "opacity-40" : ""}`}
            style={{
              top: Math.max(startOffset, 2),
              height,
              backgroundColor: baseColor,
              borderColor: adjustBrightness(baseColor, -0.3),
              outlineColor: baseColor,
              margin: "1px",
            }}
          >
            <p className={`truncate text-xs font-bold leading-tight ${getContrastTextColor(call.creator?.color || "#8B5CF6")}`}>
              {call.title}
            </p>
            <p className={`truncate text-[10px] font-normal leading-tight ${getContrastTextColor(call.creator?.color || "#8B5CF6")} opacity-80`}>
              {call.creator?.full_name || call.creator?.email || "—"}
            </p>
            <p className={`truncate text-[11px] font-medium leading-tight ${getContrastTextColor(call.creator?.color || "#8B5CF6")}`}>
              {formatTime(start)} – {formatTime(end)}
            </p>
          </button>
        )
      })}
    </div>
  )
}

function formatHour(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h % 1) * 60)
  const meridiem = hours < 12 ? "AM" : "PM"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return minutes === 0 ? `${displayHours} ${meridiem}` : `${displayHours}:${minutes.toString().padStart(2, "0")} ${meridiem}`
}

function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace("#", "")
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + Math.round(255 * amount)))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + Math.round(255 * amount)))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + Math.round(255 * amount)))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}
