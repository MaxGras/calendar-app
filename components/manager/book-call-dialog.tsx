"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, ChevronDown } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"

export function BookCallDialog({
  developer,
  initialDate,
  initialHour,
  existingCalls,
  currentProfile,
  onClose,
  onBooked,
  onCallDone,
}: {
  developer: Profile
  initialDate: Date
  initialHour: number
  existingCalls: CallWithDeveloper[]
  currentProfile: Profile
  onClose: () => void
  onBooked: (call: CallWithDeveloper) => void
  onCallDone?: (callId: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState("")
  const [descriptionLink, setDescriptionLink] = useState("")
  const [duration, setDuration] = useState(1)
  const [expandDetails, setExpandDetails] = useState(false)
  const [vacancyLink, setVacancyLink] = useState("")
  const [salary, setSalary] = useState("")

  const startTime = new Date(initialDate)
  const startHours = Math.floor(initialHour)
  const startMinutes = (initialHour % 1) * 60
  startTime.setHours(startHours, startMinutes, 0, 0)

  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + duration * 60)

  const conflicts = checkConflicts(existingCalls, developer.id, startTime, endTime)
  const canBook = !conflicts && endTime.getHours() <= DAY_END_HOUR

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canBook || pending) return

    const callTitle = title.trim() || "Call"
    const callDescription = descriptionLink.trim()

    // Create optimistic call object
    const optimisticCall: CallWithDeveloper = {
      id: `temp-${Date.now()}`,
      developer_id: developer.id,
      created_by: currentProfile.id,
      title: callTitle,
      call_link: callDescription,
      vacancy_link: vacancyLink,
      salary,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      created_at: new Date().toISOString(),
      developer,
      creator: {
        id: currentProfile.id,
        full_name: currentProfile.full_name,
        email: currentProfile.email,
        color: currentProfile.color,
      },
    }

    // Optimistically update UI
    onBooked(optimisticCall)
    onClose()

    // Send request
    startTransition(async () => {
      const res = await bookCall({
        developerId: developer.id,
        title: callTitle,
        notes: callDescription,
        vacancyLink,
        salary,
        startISO: startTime.toISOString(),
        endISO: endTime.toISOString(),
      })

      if (res.error) {
        // Revert optimistic update on error
        toast.error(res.error)
        onCallDone?.(optimisticCall.id)
        // TODO: Remove the optimistic call from state
      } else {
        toast.success(res.success ?? "Call scheduled.")
        onCallDone?.(optimisticCall.id)
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
              <Select value={String(duration)} onValueChange={(v) => v && setDuration(parseFloat(v))}>
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
            <Label htmlFor="description-link">Link to the call</Label>
            <Input
              id="description-link"
              type="url"
              value={descriptionLink}
              onChange={(e) => setDescriptionLink(e.target.value)}
              placeholder="https://example.com/job-description"
            />
          </div>

          <Separator />

          {/* Collapsible Details Section */}
          <button
            type="button"
            onClick={() => setExpandDetails(!expandDetails)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expandDetails ? "rotate-180" : ""}`}
            />
            Additional Details
          </button>

          {expandDetails && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="vacancy-link">Vacancy Link (optional)</Label>
                <Input
                  id="vacancy-link"
                  type="url"
                  value={vacancyLink}
                  onChange={(e) => setVacancyLink(e.target.value)}
                  placeholder="https://example.com/job/123"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="salary">Salary (optional)</Label>
                <Input
                  id="salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="$50k - $120k per year"
                />
              </div>
            </div>
          )}

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
