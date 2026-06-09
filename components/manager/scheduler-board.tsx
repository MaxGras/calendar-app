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

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i)
const SLOT_HEIGHT = 56 // px per hour

export function SchedulerBoard({
  developers,
  calls,
}: {
  developers: Profile[]
  calls: CallWithDeveloper[]
}) {
  const router = useRouter()
  const [developerId, setDeveloperId] = useState<string>(developers[0]?.id ?? "")
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [booking, setBooking] = useState<{ date: Date; hour: number } | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallWithDeveloper | null>(null)

  const selectedDeveloper = developers.find((d) => d.id === developerId) ?? null

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const developerCalls = useMemo(
    () => calls.filter((c) => c.developer_id === developerId),
    [calls, developerId],
  )

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

  const weekLabel = `${days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
  const now = new Date()

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Developer</span>
          <Select value={developerId} onValueChange={setDeveloperId}>
            <SelectTrigger className="w-[220px] bg-card">
              <SelectValue placeholder="Select a developer" />
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
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Day headers */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/40">
              <div className="border-r border-border" />
              {days.map((day) => {
                const isToday = sameDay(day, now)
                return (
                  <div
                    key={day.toISOString()}
                    className="border-r border-border px-2 py-2 text-center last:border-r-0"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p
                      className={
                        "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold " +
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
            <div className="grid grid-cols-[56px_repeat(7,1fr)]">
              {/* Hour labels */}
              <div className="border-r border-border">
                {HOURS.map((h) => (
                  <div key={h} className="relative border-b border-border" style={{ height: SLOT_HEIGHT }}>
                    <span className="absolute -top-2 right-1.5 text-[11px] tabular-nums text-muted-foreground">
                      {formatHour(h)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  calls={developerCalls}
                  now={now}
                  onSlotClick={(hour) => setBooking({ date: day, hour })}
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
          onBooked={() => {
            setBooking(null)
            router.refresh()
          }}
        />
      ) : null}

      {selectedCall ? (
        <CallDetailsDialog
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          onCancelled={() => {
            setSelectedCall(null)
            router.refresh()
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
    <div className="relative border-r border-border last:border-r-0">
      {HOURS.map((h) => {
        const slotStart = new Date(day)
        slotStart.setHours(h, 0, 0, 0)
        const isPast = slotStart < now
        return (
          <button
            key={h}
            type="button"
            disabled={isPast}
            onClick={() => onSlotClick(h)}
            className={
              "block w-full border-b border-border transition-colors " +
              (isPast ? "cursor-not-allowed bg-muted/30" : "hover:bg-accent/60")
            }
            style={{ height: SLOT_HEIGHT }}
            aria-label={`Book ${day.toLocaleDateString()} at ${formatHour(h)}`}
          />
        )
      })}

      {/* Booked calls overlaid */}
      {dayCalls.map((call) => {
        const start = new Date(call.start_time)
        const end = new Date(call.end_time)
        const startOffset = (start.getHours() + start.getMinutes() / 60 - DAY_START_HOUR) * SLOT_HEIGHT
        const durationHours = (end.getTime() - start.getTime()) / 3_600_000
        const height = Math.max(durationHours * SLOT_HEIGHT, 22)
        return (
          <button
            key={call.id}
            type="button"
            onClick={() => onCallClick(call)}
            className="absolute inset-x-1 overflow-hidden rounded-md border border-primary/30 bg-primary/15 px-1.5 py-1 text-left transition-colors hover:bg-primary/25"
            style={{ top: Math.max(startOffset, 0), height }}
          >
            <p className="truncate text-[11px] font-semibold leading-tight text-primary">{call.title}</p>
            <p className="truncate text-[10px] leading-tight text-primary/80">
              {formatTime(start)}–{formatTime(end)}
            </p>
          </button>
        )
      })}
    </div>
  )
}

function formatHour(h: number): string {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: "numeric" })
}
