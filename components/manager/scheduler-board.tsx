"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookCallDialog } from "@/components/manager/book-call-dialog"
import { CallDetailsDialog } from "@/components/manager/call-details-dialog"

// Generate 30-minute slots
const SLOTS = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * 2 },
  (_, i) => DAY_START_HOUR + i * 0.5
)
const SLOT_HEIGHT = 32 // px per 30-minute slot
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function SchedulerBoard({
  developers,
  calls: initialCalls,
  currentProfile,
  recurringCalls = [],
}: {
  developers: Profile[]
  calls: CallWithDeveloper[]
  currentProfile: Profile
  recurringCalls?: any[]
}) {
  const router = useRouter()
  const [developerId, setDeveloperId] = useState<string>(developers[0]?.id ?? "")
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [booking, setBooking] = useState<{ date: Date; hour: number } | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallWithDeveloper | null>(null)
  const [calls, setCalls] = useState<CallWithDeveloper[]>(initialCalls)
  const [pendingCallIds, setPendingCallIds] = useState<Set<string>>(new Set())

  const selectedDeveloper = developers.find((d) => d.id === developerId) ?? null

  // Debug: Log recurring calls for the selected developer
  const developerRecurringCallsDebug = recurringCalls.filter((r) => r.developer_id === developerId)
  if (developerRecurringCallsDebug.length > 0) {
    console.log(`Developer ${developerId} has ${developerRecurringCallsDebug.length} recurring calls:`, developerRecurringCallsDebug)
  }

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const developerCalls = useMemo(() => {
    const oneTimeCalls = calls.filter((c) => c.developer_id === developerId)

    // Generate recurring call instances for this developer
    const developerRecurringCalls = recurringCalls.filter((r) => r.developer_id === developerId)
    const generatedInstances: any[] = []

    developerRecurringCalls.forEach((recurring) => {
      days.forEach((day) => {
        const dayOfWeek = DAYS_SHORT[day.getDay()]
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

          // Use sales manager's color if assigned, otherwise use developer's color
          const creatorColor = recurring.sales_manager?.color || recurring.developer?.color || "#8B5CF6"
          const creatorName = recurring.sales_manager?.full_name || recurring.sales_manager?.email || currentProfile.full_name || currentProfile.email
          const creatorId = recurring.sales_manager?.id || currentProfile.id

          generatedInstances.push({
            id: `${recurring.id}-${day.toISOString()}`,
            developer_id: recurring.developer_id,
            title: recurring.title,
            call_link: recurring.call_link,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            created_by: creatorId,
            created_at: recurring.created_at,
            updated_at: recurring.updated_at,
            developer: { id: recurring.developer_id, full_name: "", email: "" },
            creator: { id: creatorId, full_name: creatorName, email: recurring.sales_manager?.email || currentProfile.email, color: creatorColor },
            isRecurringInstance: true,
            recurringCallId: recurring.id,
            instanceDate: day.toISOString().split("T")[0],
          } as any)
        }
      })
    })

    return [...oneTimeCalls, ...generatedInstances]
  }, [calls, developerId, recurringCalls, days, currentProfile])

  // Optimistic update handlers
  const addCallOptimistic = (call: CallWithDeveloper) => {
    setCalls((prev) => [...prev, call])
    setPendingCallIds((prev) => new Set([...prev, call.id]))
  }

  const removeCallOptimistic = (callId: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== callId))
    setPendingCallIds((prev) => {
      const next = new Set(prev)
      next.delete(callId)
      return next
    })
    setSelectedCall(null)
  }

  const clearPendingCall = (callId: string) => {
    setPendingCallIds((prev) => {
      const next = new Set(prev)
      next.delete(callId)
      return next
    })
  }

  if (developers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No developers yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ask an admin to create developer accounts before scheduling calls.
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
  const isCurrentDayInWeek = days.some(d => sameDay(d, now))

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Developer</span>
          <Select value={developerId} onValueChange={(v) => v && setDeveloperId(v)}>
            <SelectTrigger className="w-[220px] bg-card">
              <SelectValue placeholder="Select a developer">
                {selectedDeveloper && (selectedDeveloper.full_name || selectedDeveloper.email)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {developers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name || d.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  calls={developerCalls}
                  now={now}
                  pendingCallIds={pendingCallIds}
                  onSlotClick={(hour) => setBooking({ date: day, hour: Math.floor(hour) })}
                  onCallClick={(call) => setSelectedCall(call)}
                  currentTimeOffset={sameDay(day, now) ? currentTimeOffset : -1}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Click an empty slot to book a call. Times shown in your local timezone.
      </p>

      {booking && selectedDeveloper ? (
        <BookCallDialog
          developer={selectedDeveloper}
          initialDate={booking.date}
          initialHour={booking.hour}
          existingCalls={developerCalls}
          currentProfile={currentProfile}
          onClose={() => setBooking(null)}
          onBooked={(newCall) => {
            setBooking(null)
            addCallOptimistic(newCall)
          }}
          onCallDone={clearPendingCall}
        />
      ) : null}

      {selectedCall ? (
        <CallDetailsDialog
          call={selectedCall}
          currentProfile={currentProfile}
          onClose={() => setSelectedCall(null)}
          onCancelled={(callId) => {
            removeCallOptimistic(callId)
          }}
          onDeleteRecurring={() => {
            if ((selectedCall as any).isRecurringInstance) {
              removeCallOptimistic(selectedCall.id)
            }
          }}
        />
      ) : null}
    </div>
  )
}

function DayColumn({
  day,
  calls,
  now,
  pendingCallIds,
  onSlotClick,
  onCallClick,
  currentTimeOffset,
}: {
  day: Date
  calls: CallWithDeveloper[]
  now: Date
  pendingCallIds: Set<string>
  onSlotClick: (hour: number) => void
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
          <button
            key={slot}
            type="button"
            disabled={isPast}
            onClick={() => onSlotClick(slot)}
            className={
              "group relative block w-full border-b border-border/50 transition-all " +
              (isPast ? "cursor-not-allowed bg-muted/35" : "cursor-pointer hover:bg-accent/40 hover:shadow-sm") +
              (isHalfHour && !isPast ? " bg-muted/5" : "")
            }
            style={{ height: SLOT_HEIGHT }}
            aria-label={`Book ${formatDate(day)} at ${formatHour(slot)}`}
          >
            {!isPast && !isHalfHour && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs font-semibold text-accent">+ Book</span>
              </div>
            )}
          </button>
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
        const isPending = pendingCallIds.has(call.id)
        const isRecurring = (call as any).isRecurringInstance
        const isPast = end <= now

        // Calculate position in 30-minute slots
        const startTotalMinutes = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
        const startSlotNumber = startTotalMinutes / 30
        const startOffset = startSlotNumber * SLOT_HEIGHT

        // Calculate height in 30-minute slots
        const durationMinutes = (end.getTime() - start.getTime()) / 60_000
        const durationSlots = durationMinutes / 30
        const height = Math.max(durationSlots * SLOT_HEIGHT, 32)

        const baseColor = call.creator?.color || "#8B5CF6"

        return (
          <button
            key={call.id}
            type="button"
            onClick={() => onCallClick(call)}
            disabled={isPending}
            className={`absolute inset-x-2 overflow-hidden rounded-lg border-2 px-2 py-1.5 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 ${isPending ? "pointer-events-none opacity-50 cursor-not-allowed" : isPast ? "opacity-40" : ""}`}
            style={{
              top: Math.max(startOffset, 2),
              height,
              margin: "1px",
              backgroundColor: baseColor,
              borderColor: adjustBrightness(baseColor, -0.3),
              outlineColor: baseColor,
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

function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
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
