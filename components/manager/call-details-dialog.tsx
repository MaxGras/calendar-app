"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { cancelCall } from "@/app/actions/calls";
import { deleteRecurringCall } from "@/app/actions/recurring-calls";
import type { CallWithDeveloper, Profile } from "@/lib/types";
import { formatDateTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function CallDetailsDialog({
  call,
  currentProfile,
  onClose,
  onCancelled,
  readOnly = false,
  onDeleteRecurring,
}: {
  call: CallWithDeveloper;
  currentProfile: Profile;
  onClose: () => void;
  onCancelled: (callId: string) => void;
  readOnly?: boolean;
  onDeleteRecurring?: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const start = new Date(call.start_time);
  const end = new Date(call.end_time);
  const canDelete = call.created_by === currentProfile.id;
  const showLink = currentProfile.role !== "sales_manager";
  const isRecurringInstance = (call as any).isRecurringInstance;
  const recurringCallId = (call as any).recurringCallId;

  function handleCancel() {
    // Optimistically remove from UI
    setDeleteOpen(false);
    onClose();
    onCancelled(call.id);

    if (isRecurringInstance) {
      toast.success("Recurring call deleted.");
      // Send request
      startTransition(async () => {
        const res = await deleteRecurringCall(recurringCallId);
        if (res.error) {
          toast.error(res.error);
        }
      });
    } else {
      toast.success("Call cancelled.");
      // Send request
      startTransition(async () => {
        const res = await cancelCall(call.id);
        if (res.error) {
          toast.error(res.error);
          // TODO: Re-add the call to state
        }
      });
    }
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
              <p className="text-xs font-medium text-muted-foreground">Title</p>
              <p className="mt-1 text-sm font-medium text-foreground">{call.title}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Developer</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {call.developer?.full_name || call.developer?.email || "Unknown developer"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Date & Time</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatDateTime(start)}</p>
              <p className="text-sm text-muted-foreground">
                to {end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Created by</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {call.creator?.full_name || call.creator?.email || "Unknown"}
              </p>
            </div>

            <Separator />

            {call.call_link && showLink ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Link to the call</p>
                <p className="mt-1 text-sm text-foreground break-all">
                  {call.call_link.startsWith("http") ? (
                    <a
                      href={call.call_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {call.call_link}
                    </a>
                  ) : (
                    call.call_link
                  )}
                </p>
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
              <Button type="button" variant="destructive" disabled={pending} onClick={handleCancel}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel call"}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              {(!readOnly || isRecurringInstance) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canDelete}
                  onClick={() => {
                    if (isRecurringInstance && onDeleteRecurring) {
                      onDeleteRecurring();
                      onClose();
                    } else {
                      setDeleteOpen(true);
                    }
                  }}
                  title={!canDelete ? "Only the creator can delete this call" : isRecurringInstance ? "Delete recurring call" : "Cancel call"}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{isRecurringInstance ? "Delete recurring call" : "Cancel call"}</span>
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
