"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addDays, startOfWeek, sameDay, formatTime, DAY_START_HOUR, DAY_END_HOUR } from "@/lib/time"
import { getContrastTextColor } from "@/lib/color"

const SLOTS = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * 2 },
  (_, i) => DAY_START_HOUR + i * 0.5
)
const SLOT_HEIGHT = 24
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function DeveloperScheduleModal({
  open,
  onOpenChange,
  developerName,
  calls = [],
  recurringCalls = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  developerName: string
  calls?: any[]
  recurringCalls?: any[]
}) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const allInstances = useMemo(() => {
    const instances: any[] = []

    // Add one-time calls
    calls.forEach((call) => {
      instances.push({
        id: call.id,
        title: call.title,
        color: call.creator?.color || "#8B5CF6",
        start: new Date(call.start_time),
        end: new Date(call.end_time),
        isRecurring: false,
      })
    })

    // Add recurring call instances for this week
    recurringCalls.forEach((recurring) => {
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

          instances.push({
            id: `${recurring.id}-${day.toISOString()}`,
            title: recurring.title,
            color: "#8B5CF6",
            start,
            end,
            isRecurring: true,
          })
        }
      })
    })

    return instances
  }, [calls, recurringCalls, days])

  const formatDateCompact = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.getMonth()]} ${date.getDate()}`
  }

  const weekLabel = `${formatDateCompact(days[0])} – ${formatDateCompact(days[6])} ${days[6].getFullYear()}`
  const now = new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{developerName}'s Schedule</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <div className="flex items-center rounded-md border border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] px-2 text-center text-sm font-medium">{weekLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Day headers */}
              <div className="sticky top-0 z-10 grid grid-cols-[80px_repeat(7,1fr)] border-b-2 border-border bg-secondary/50">
                <div className="border-r border-border" />
                {days.map((day) => {
                  const isToday = sameDay(day, now)
                  return (
                    <div
                      key={day.toISOString()}
                      className={`border-r border-border px-3 py-3 text-center last:border-r-0 ${isToday ? "bg-accent/10" : ""}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {DAYS_SHORT[day.getDay()]}
                      </p>
                      <p
                        className={
                          "mt-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold mx-auto " +
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
                {/* Time labels */}
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
                  <div key={day.toISOString()} className="relative border-r border-border/50 last:border-r-0">
                    {SLOTS.map((slot) => (
                      <div
                        key={slot}
                        className="relative block w-full border-b border-border/50"
                        style={{ height: SLOT_HEIGHT }}
                      />
                    ))}

                    {/* Events */}
                    {allInstances
                      .filter((inst) => sameDay(inst.start, day))
                      .map((inst) => {
                        const startTotalMinutes = (inst.start.getHours() - DAY_START_HOUR) * 60 + inst.start.getMinutes()
                        const startSlotNumber = startTotalMinutes / 30
                        const startOffset = startSlotNumber * SLOT_HEIGHT
                        const durationMinutes = (inst.end.getTime() - inst.start.getTime()) / 60_000
                        const durationSlots = durationMinutes / 30
                        const height = Math.max(durationSlots * SLOT_HEIGHT, SLOT_HEIGHT)

                        return (
                          <div
                            key={inst.id}
                            className="absolute inset-x-1 overflow-hidden rounded border px-1 py-0.5 text-left"
                            style={{
                              top: Math.max(startOffset, 2),
                              height,
                              backgroundColor: inst.color,
                              borderColor: adjustBrightness(inst.color, -0.3),
                              borderWidth: "1px",
                              margin: "1px",
                              backgroundImage: inst.isRecurring
                                ? `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 15px,
                                    rgba(255, 255, 255, 0.12) 15px,
                                    rgba(255, 255, 255, 0.12) 18px
                                  )`
                                : undefined,
                            }}
                            title={inst.isRecurring ? "Recurring call" : undefined}
                          >
                            <p className={`truncate text-[10px] font-bold leading-tight ${getContrastTextColor(inst.color)}`}>
                              {inst.title}
                            </p>
                            <p className={`truncate text-[8px] leading-tight ${getContrastTextColor(inst.color)}`}>
                              {formatTime(inst.start)} – {formatTime(inst.end)}
                            </p>
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground mt-3">
          <span className="inline-block w-2 h-2 rounded border-2 border-current mr-2 align-middle"></span>
          Solid blocks = one-time calls |
          <span className="inline-block w-2 h-2 rounded border-2 border-current mr-2 ml-2 align-middle" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255, 255, 255, 0.12) 15px, rgba(255, 255, 255, 0.12) 18px)'}}></span>
          Striped = recurring calls
        </p>
      </DialogContent>
    </Dialog>
  )
}

function formatHour(h: number): string {
  const hours = Math.floor(h)
  const meridiem = hours < 12 ? "AM" : "PM"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours} ${meridiem}`
}

function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace("#", "")
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + Math.round(255 * amount)))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + Math.round(255 * amount)))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + Math.round(255 * amount)))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}
