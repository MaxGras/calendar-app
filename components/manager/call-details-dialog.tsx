"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { cancelCall } from "@/app/actions/calls"
import type { CallWithDeveloper } from "@/lib/types"
import { formatDateTime } from "@/lib/time"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export function CallDetailsDialog({
  call,
  onClose,
  onCancelled,
}: {
  call: CallWithDeveloper
  onClose: () => void
  onCancelled: () => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const start = new Date(call.start_time)
  const end = new Date(call.end_time)

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelCall(call.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success ?? "Call cancelled.")
        setDeleteOpen(false)
        onClose()
        onCancelled()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{call.title}</DialogTitle>
          <DialogDescription>
            {call.developer?.full_name || call.developer?.email || "Unknown developer"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Date & Time</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatDateTime(start)}</p>
              <p className="text-sm text-muted-foreground">
                to {end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>

            <Separator />

            {call.notes ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{call.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          {deleteOpen ? (
            <>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                Keep it
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={handleCancel}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel call"}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Cancel call</span>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
