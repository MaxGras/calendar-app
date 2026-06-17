"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { deleteRecurringCall } from "@/app/actions/recurring-calls"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function CustomCallsList({ calls }: { calls: any[] }) {
  const [pending, startTransition] = useTransition()
  const [localCalls, setLocalCalls] = useState(calls)

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteRecurringCall(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Recurring call deleted")
        setLocalCalls((prev) => prev.filter((c) => c.id !== id))
      }
    })
  }

  if (localCalls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No recurring calls yet. Create one to get started!</p>
      </div>
    )
  }

  const formatRepeatText = (call: any) => {
    if (call.repeat_type === "daily") {
      return "Every day"
    } else if (call.repeat_type === "weekly") {
      return "Every week"
    } else if (call.repeat_type === "biweekly") {
      return "Every two weeks"
    } else if (call.repeat_type === "custom") {
      const days = call.repeat_days?.join(", ") || ""
      const interval = call.repeat_interval === "biweekly" ? "every 2 weeks" : "every week"
      return `${days} ${interval}`
    }
    return "Unknown"
  }

  const formatTime = (hour: number, minute: number) => {
    const meridiem = hour < 12 ? "AM" : "PM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${String(minute).padStart(2, "0")} ${meridiem}`
  }

  return (
    <div className="flex flex-col gap-4">
      {localCalls.map((call) => (
        <Card key={call.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-foreground">{call.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {call.sales_manager?.full_name || call.sales_manager?.email || "You"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatRepeatText(call)} at {formatTime(call.hour, call.minute)}
                </p>
                {call.call_link && (
                  <a
                    href={call.call_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    {call.call_link}
                  </a>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(call.id)}
                disabled={pending}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
