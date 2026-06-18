"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { deleteRecurringCall, cancelRecurringCallInstance } from "@/app/actions/recurring-calls"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export function DeleteRecurringCallModal({
  open,
  onOpenChange,
  recurringCallId,
  recurringCallTitle,
  instanceDate,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recurringCallId: string
  recurringCallTitle: string
  instanceDate?: string
  onSuccess?: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<"instance" | "all" | null>(null)

  const handleDeleteInstance = () => {
    if (!instanceDate) return

    startTransition(async () => {
      const res = await cancelRecurringCallInstance(recurringCallId, instanceDate)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success)
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  const handleDeleteAll = () => {
    startTransition(async () => {
      const res = await deleteRecurringCall(recurringCallId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success)
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-4">
        {!action ? (
          <>
            <DialogHeader className="pb-1">
              <DialogTitle className="text-sm font-semibold text-foreground">{recurringCallTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5 py-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-auto py-1.5 justify-start px-2 text-xs"
                onClick={() => setAction("instance")}
                disabled={!instanceDate}
              >
                <div className="text-left w-full">
                  <p className="font-medium text-foreground">Skip this date</p>
                  <p className="text-xs text-muted-foreground leading-none">
                    {instanceDate ? new Date(instanceDate).toLocaleDateString() : "—"}
                  </p>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-auto py-1.5 justify-start px-2 text-xs border-red-200 hover:bg-red-50"
                onClick={() => setAction("all")}
              >
                <div className="text-left w-full">
                  <p className="font-medium text-destructive">Delete all</p>
                  <p className="text-xs text-muted-foreground leading-none">Entire recurring call</p>
                </div>
              </Button>
            </div>

            <DialogFooter className="gap-2 pt-1">
              <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : action === "instance" ? (
          <>
            <DialogHeader className="pb-1">
              <DialogTitle className="text-xs">Skip {new Date(instanceDate!).toLocaleDateString()}?</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground py-1.5">
              This date will be skipped. Other dates continue normally.
            </p>
            <DialogFooter className="gap-2 pt-1">
              <Button size="xs" variant="outline" onClick={() => setAction(null)} disabled={pending}>
                Back
              </Button>
              <Button size="xs" onClick={handleDeleteInstance} disabled={pending}>
                {pending ? "Skipping..." : "Skip"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="pb-1">
              <DialogTitle className="text-xs">Delete "{recurringCallTitle}"?</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground py-1.5">
              All occurrences will be permanently deleted.
            </p>
            <DialogFooter className="gap-2 pt-1">
              <Button size="xs" variant="outline" onClick={() => setAction(null)} disabled={pending}>
                Back
              </Button>
              <Button size="xs" variant="destructive" onClick={handleDeleteAll} disabled={pending}>
                {pending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
