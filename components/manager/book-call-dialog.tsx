"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { bookCall } from "@/app/actions/calls"
import type { CallWithDeveloper, Profile } from "@/lib/types"
import { DAY_END_HOUR, DAY_START_HOUR } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BookCallDialog({
  developer,
  initialDate,
  initialHour,
  existingCalls,
  onClose,
  onBooked,
}: {
  developer: Profile
  initialDate: Date
  initialHour: number
  existingCalls: CallWithDeveloper[]
  onClose: () => void
  onBooked: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [duration, setDuration] = useState(1)

  const startTime = new Date(initialDate)
  startTime.setHours(initialHour, 0, 0, 0)

  const endTime = new Date(startTime)
  endTime.setHours(endTime.getHours() + duration)

  const conflicts = checkConflicts(existingCalls, developer.id, startTime, endTime)
  const canBook = !conflicts && endTime.getHours() <= DAY_END_HOUR

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canBook || pending) return

    startTransition(async () => {
      const res = await bookCall({
        developerId: developer.id,
        title: title.trim() || "Call",
        notes: notes.trim(),
        startISO: startTime.toISOString(),
        endISO: endTime.toISOString(),
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success ?? "Call scheduled.")
        onClose()
        onBooked()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a call</DialogTitle>
          <DialogDescription>
            Schedule with {developer.full_name || developer.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {startTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {startTime.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {endTime.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Select value={String(duration)} onValueChange={(v) => v && setDuration(parseInt(v))}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0.5, 1, 1.5, 2, 3, 4].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h === 0.5 ? "30 min" : h % 1 === 0 ? `${h}h` : `${h}h`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {conflicts ? (
              <div className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1.5 col-span-2">
                <p className="text-xs text-destructive">Overlaps with existing call</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Call title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Technical interview"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interview with John about React expertise..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canBook || pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book call"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function checkConflicts(
  calls: CallWithDeveloper[],
  developerId: string,
  start: Date,
  end: Date,
): boolean {
  return calls.some((call) => {
    if (call.developer_id !== developerId) return false
    const callStart = new Date(call.start_time)
    const callEnd = new Date(call.end_time)
    return start < callEnd && end > callStart
  })
}
