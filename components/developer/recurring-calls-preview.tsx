"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { addDays, startOfWeek, sameDay, formatTime, DAY_START_HOUR, DAY_END_HOUR } from "@/lib/time"
import { getContrastTextColor } from "@/lib/color"

const SLOTS = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * 2 },
  (_, i) => DAY_START_HOUR + i * 0.5
)
const SLOT_HEIGHT = 24
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function RecurringCallsPreview({
  recurringCalls,
  formState,
}: {
  recurringCalls: any[]
  formState?: any
}) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const generatedInstances = useMemo(() => {
    const instances: any[] = []

    // Add saved recurring calls
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
            isPreview: false,
          })
        }
      })
    })

    // Add preview from form state
    if (formState?.title) {
      const applicableDays =
        formState.repeatType === "daily"
          ? DAYS_SHORT
          : formState.repeatType === "weekly" || formState.repeatType === "biweekly" || formState.repeatType === "custom"
            ? formState.customDays
            : []

      days.forEach((day) => {
        const dayOfWeek = DAYS_SHORT[day.getDay()]
        if (applicableDays.includes(dayOfWeek)) {
          const start = new Date(day)
          start.setHours(parseInt(formState.hour), parseInt(formState.minute), 0, 0)

          const end = new Date(start)
          end.setMinutes(end.getMinutes() + parseInt(formState.durationMinutes))

          instances.push({
            id: `preview-${day.toISOString()}`,
            title: formState.title,
            color: "#3B82F6",
            start,
            end,
            isPreview: true,
          })
        }
      })
    }

    return instances
  }, [recurringCalls, formState, days])

  const formatDateCompact = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.getMonth()]} ${date.getDate()}`
  }

  const weekLabel = `${formatDateCompact(days[0])} – ${formatDateCompact(days[6])} ${days[6].getFullYear()}`
  const now = new Date()
  const hasPreview = formState?.title && (formState?.customDays?.length > 0 || formState?.repeatType === "daily")

  if (recurringCalls.length === 0 && !hasPreview) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-muted-foreground">No recurring calls yet.</p>
          <p className="text-xs text-muted-foreground">Fill in the form on the left to see a preview.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          Today
        </Button>
        <div className="flex items-center rounded-md border border-border bg-card">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="min-w-[140px] px-2 text-center text-xs font-medium text-foreground">{weekLabel}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden border border-border bg-card p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-secondary/50">
              <div className="border-r border-border" />
              {days.map((day) => {
                const isToday = sameDay(day, now)
                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-border px-2 py-2 text-center last:border-r-0 ${isToday ? "bg-accent/10" : ""}`}
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}
                    </p>
                    <p
                      className={
                        "mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mx-auto " +
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
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {/* Time labels */}
              <div className="border-r border-border bg-muted/20">
                {SLOTS.map((slot) => {
                  const isHourStart = slot % 1 === 0
                  return (
                    <div
                      key={slot}
                      className={`relative border-b border-border/50 px-1 py-0.5 text-center ${!isHourStart ? "bg-muted/5" : ""}`}
                      style={{ height: SLOT_HEIGHT }}
                    >
                      {isHourStart && <span className="text-xs font-semibold text-muted-foreground">{formatHour(slot)}</span>}
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
                  {generatedInstances
                    .filter((inst) => sameDay(new Date(inst.start), day))
                    .map((inst) => {
                      const start = new Date(inst.start)
                      const end = new Date(inst.end)
                      const startTotalMinutes = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
                      const startSlotNumber = startTotalMinutes / 30
                      const startOffset = startSlotNumber * SLOT_HEIGHT
                      const durationMinutes = (end.getTime() - start.getTime()) / 60_000
                      const durationSlots = durationMinutes / 30
                      const height = Math.max(durationSlots * SLOT_HEIGHT, SLOT_HEIGHT)

                      return (
                        <div
                          key={inst.id}
                          className={`absolute inset-x-1 overflow-hidden rounded border px-1 py-0.5 text-left ${
                            inst.isPreview ? "opacity-70" : ""
                          }`}
                          style={{
                            top: Math.max(startOffset, 2),
                            height,
                            backgroundColor: inst.color,
                            backgroundImage: (inst.isRecurring || inst.isPreview)
                              ? `repeating-linear-gradient(
                                  45deg,
                                  transparent,
                                  transparent 15px,
                                  rgba(255, 255, 255, 0.12) 15px,
                                  rgba(255, 255, 255, 0.12) 18px
                                )`
                              : undefined,
                            borderColor: adjustBrightness(inst.color, inst.isPreview ? -0.5 : -0.3),
                            borderWidth: "1px",
                            margin: "1px",
                          }}
                          title={inst.isPreview ? "Preview (not yet created)" : inst.isRecurring ? "Recurring call" : undefined}
                        >
                          <p className={`truncate text-[10px] font-bold leading-tight ${getContrastTextColor(inst.color)}`}>
                            {inst.title} {inst.isPreview ? "(preview)" : ""}
                          </p>
                          <p className={`truncate text-[8px] leading-tight ${getContrastTextColor(inst.color)}`}>
                            {formatTime(start)} – {formatTime(end)}
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
    </div>
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
