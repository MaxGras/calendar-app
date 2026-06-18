"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { updateDefaultTimezone } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// List of common timezones (IANA format)
const TIMEZONES = [
  { label: "UTC+0 (GMT)", value: "UTC" },
  { label: "UTC+1 (CET)", value: "Europe/Paris" },
  { label: "UTC+2 (EET) - Kyiv", value: "Europe/Kyiv" },
  { label: "UTC+3 (MSK) - Moscow", value: "Europe/Moscow" },
  { label: "UTC+5:30 (IST) - India", value: "Asia/Kolkata" },
  { label: "UTC+8 (CST) - Shanghai", value: "Asia/Shanghai" },
  { label: "UTC+9 (JST) - Tokyo", value: "Asia/Tokyo" },
  { label: "UTC-5 (EST) - New York", value: "America/New_York" },
  { label: "UTC-6 (CST) - Chicago", value: "America/Chicago" },
  { label: "UTC-7 (MST) - Denver", value: "America/Denver" },
  { label: "UTC-8 (PST) - Los Angeles", value: "America/Los_Angeles" },
  { label: "UTC+10 (AEST) - Sydney", value: "Australia/Sydney" },
]

export function TimezoneSettings({ defaultTimezone }: { defaultTimezone: string }) {
  const [timezone, setTimezone] = useState(defaultTimezone)
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    if (timezone === defaultTimezone) {
      toast.info("No changes to save")
      return
    }

    startTransition(async () => {
      const res = await updateDefaultTimezone(timezone)

      if (res.error) {
        toast.error(res.error)
        setTimezone(defaultTimezone)
      } else {
        toast.success(res.success)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timezone Settings</CardTitle>
        <CardDescription>
          Set the default timezone for all calls in the application. All times will be displayed in this timezone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Default Timezone</label>
          <Select value={timezone} onValueChange={setTimezone} disabled={pending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <p className="font-medium mb-2">Current Setting:</p>
          <p className="text-muted-foreground">
            {TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={pending || timezone === defaultTimezone}
          className="w-full"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Timezone
        </Button>
      </CardContent>
    </Card>
  )
}
