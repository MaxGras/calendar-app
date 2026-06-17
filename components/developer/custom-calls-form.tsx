"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createRecurringCall } from "@/app/actions/recurring-calls"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function CustomCallsForm({
  salesManagers,
  currentProfile,
}: {
  salesManagers: Profile[]
  currentProfile: Profile
}) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState("")
  const [callLink, setCallLink] = useState("")
  const [salesManagerId, setSalesManagerId] = useState(currentProfile.id)
  const [repeatType, setRepeatType] = useState("weekly")
  const [customDays, setCustomDays] = useState<string[]>([])
  const [repeatInterval, setRepeatInterval] = useState("weekly")
  const [hour, setHour] = useState("9")
  const [minute, setMinute] = useState("0")

  const handleDayToggle = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (repeatType === "custom" && customDays.length === 0) {
      toast.error("Please select at least one day for custom repeat")
      return
    }

    startTransition(async () => {
      const res = await createRecurringCall({
        title: title.trim(),
        callLink: callLink.trim(),
        salesManagerId: salesManagerId === currentProfile.id ? null : salesManagerId,
        repeatType,
        repeatDays: repeatType === "custom" ? customDays : [],
        repeatInterval: repeatType === "custom" ? repeatInterval : "weekly",
        hour: parseInt(hour),
        minute: parseInt(minute),
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Recurring call created!")
        setTitle("")
        setCallLink("")
        setSalesManagerId(currentProfile.id)
        setRepeatType("weekly")
        setCustomDays([])
        setRepeatInterval("weekly")
        setHour("9")
        setMinute("0")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Call Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Weekly Sync"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="call-link">Call Link (optional)</Label>
        <Input
          id="call-link"
          type="url"
          value={callLink}
          onChange={(e) => setCallLink(e.target.value)}
          placeholder="https://example.com/meeting"
          disabled={pending}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="sales-manager">Sales Manager</Label>
        <Select value={salesManagerId} onValueChange={setSalesManagerId} disabled={pending}>
          <SelectTrigger id="sales-manager">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={currentProfile.id}>
              {currentProfile.full_name || currentProfile.email} (Me)
            </SelectItem>
            {salesManagers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.full_name || manager.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="repeat-type">Repeat</Label>
        <Select value={repeatType} onValueChange={setRepeatType} disabled={pending}>
          <SelectTrigger id="repeat-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Every Day</SelectItem>
            <SelectItem value="weekly">Every Week</SelectItem>
            <SelectItem value="biweekly">Every Two Weeks</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {repeatType === "custom" && (
        <>
          <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg">
            <Label>Select Days</Label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(DAYS_SHORT[index])}
                  disabled={pending}
                  className={`py-2 px-2 rounded-md text-sm font-medium transition-all ${
                    customDays.includes(DAYS_SHORT[index])
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repeat-interval">Repeat Interval</Label>
            <Select value={repeatInterval} onValueChange={setRepeatInterval} disabled={pending}>
              <SelectTrigger id="repeat-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="biweekly">Every Two Weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="hour">Hour</Label>
          <Select value={hour} onValueChange={setHour} disabled={pending}>
            <SelectTrigger id="hour">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {String(i).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="minute">Minute</Label>
          <Select value={minute} onValueChange={setMinute} disabled={pending}>
            <SelectTrigger id="minute">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 15, 30, 45].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Create Recurring Call
      </Button>
    </form>
  )
}
