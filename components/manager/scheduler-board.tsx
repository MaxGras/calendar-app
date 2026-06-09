"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import type { CallWithDeveloper, Profile } from "@/lib/types"
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

export function SchedulerBoard({
  developers,
  calls: initialCalls,
  currentProfile,
}: {
  developers: Profile[]
  calls: CallWithDeveloper[]
  currentProfile: Profile
}) {
  const router = useRouter()
  const [developerId, setDeveloperId] = useState<string>(developers[0]?.id ?? "")
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [booking, setBooking] = useState<{ date: Date; hour: number } | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallWithDeveloper | null>(null)
  const [calls, setCalls] = useState<CallWithDeveloper[]>(initialCalls)

  const selectedDeveloper = developers.find((d) => d.id === developerId) ?? null

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const developerCalls = useMemo(
    () => calls.filter((c) => c.developer_id === developerId),
    [calls, developerId],
  )

  // Optimistic update handlers
  const addCallOptimistic = (call: CallWithDeveloper) => {
    setCalls((prev) => [...prev, call])
  }

  const removeCallOptimistic = (callId: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== callId))
    setSelectedCall(null)
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
                  onSlotClick={(hour) => setBooking({ date: day, hour: Math.floor(hour) })}
                  onCallClick={(call) => setSelectedCall(call)}
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
          onClose={() => setBooking(null)}
          onBooked={(newCall) => {
            setBooking(null)
            addCallOptimistic(newCall)
          }}
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
        />
      ) : null}
    </div>
  )
}

function DayColumn({
  day,
  calls,
  now,
  onSlotClick,
  onCallClick,
}: {
  day: Date
  calls: CallWithDeveloper[]
  now: Date
  onSlotClick: (hour: number) => void
  onCallClick: (call: CallWithDeveloper) => void
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
              (isPast ? "cursor-not-allowed bg-muted/10" : "cursor-pointer hover:bg-accent/40 hover:shadow-sm") +
              (isHalfHour ? " bg-muted/5" : "")
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

      {/* Booked calls overlaid */}
      {dayCalls.map((call) => {
        const start = new Date(call.start_time)
        const end = new Date(call.end_time)

        // Calculate position in 30-minute slots
        const startTotalMinutes = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
        const startSlotNumber = startTotalMinutes / 30
        const startOffset = startSlotNumber * SLOT_HEIGHT

        // Calculate height in 30-minute slots
        const durationMinutes = (end.getTime() - start.getTime()) / 60_000
        const durationSlots = durationMinutes / 30
        const height = Math.max(durationSlots * SLOT_HEIGHT, 32)
        return (
          <button
            key={call.id}
            type="button"
            onClick={() => onCallClick(call)}
            className="absolute inset-x-2 overflow-hidden rounded-lg border-2 border-primary bg-muted px-2 py-1.5 text-left transition-all hover:bg-muted/80 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{ top: Math.max(startOffset, 0), height }}
          >
            <p className="truncate text-xs font-bold leading-tight text-white">{call.title}</p>
            <p className="truncate text-[10px] font-normal leading-tight text-white/80">
              {call.creator?.full_name || call.creator?.email || "—"}
            </p>
            <p className="truncate text-[11px] font-medium leading-tight text-white">
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
