"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { cancelCall } from "@/app/actions/calls";
import { deleteRecurringCall, cancelRecurringCallInstance } from "@/app/actions/recurring-calls";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CallDetailsDialog({
  call,
  currentProfile,
  onClose,
  onCancelled,
  readOnly = false,
}: {
  call: CallWithDeveloper;
  currentProfile: Profile;
  onClose: () => void;
  onCancelled: (callId: string) => void;
  readOnly?: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"one" | "all" | null>(null);
  const [pending, startTransition] = useTransition();

  const start = new Date(call.start_time);
  const end = new Date(call.end_time);
  const isRecurringInstance = (call as any).isRecurringInstance;
  const recurringCallId = (call as any).recurringCallId;
  const instanceDate = (call as any).instanceDate;

  // For regular calls, can delete if created by current user
  // For recurring calls as manager, can only delete if assigned to this call
  const canDelete = !isRecurringInstance
    ? call.created_by === currentProfile.id
    : currentProfile.role === "admin" || (currentProfile.role === "sales_manager" && call.created_by === currentProfile.id);
  const showLink = currentProfile.role !== "sales_manager";

  function handleCancel() {
    // Optimistically remove from UI
    setDeleteOpen(false);
    onClose();
    onCancelled(call.id);

    if (isRecurringInstance) {
      if (deleteMode === "all") {
        toast.success("Recurring call series deleted.");
        startTransition(async () => {
          const res = await deleteRecurringCall(recurringCallId);
          if (res.error) {
            toast.error(res.error);
          }
        });
      } else if (deleteMode === "one") {
        toast.success("Call instance cancelled.");
        startTransition(async () => {
          const res = await cancelRecurringCallInstance(recurringCallId, instanceDate);
          if (res.error) {
            toast.error(res.error);
          }
        });
      }
    } else {
      toast.success("Call cancelled.");
      // Send request
      startTransition(async () => {
        const res = await cancelCall(call.id);
        if (res.error) {
          toast.error(res.error);
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
              {!readOnly && canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (isRecurringInstance) {
                      setDeleteMode(null);
                    } else {
                      setDeleteOpen(true);
                    }
                  }}
                  title="Delete call"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete call</span>
                </Button>
              )}
            </>
          )}
        </DialogFooter>

        {/* Delete mode selection for recurring calls */}
        <AlertDialog open={isRecurringInstance && deleteMode === null && canDelete} onOpenChange={() => setDeleteMode(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recurring Call</AlertDialogTitle>
              <AlertDialogDescription>
                How would you like to delete this recurring call?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <DialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteMode("one")}
              >
                Delete This Instance Only
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteMode("all")}
              >
                Delete Entire Series
              </Button>
            </DialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmation dialog for selected delete mode */}
        <AlertDialog open={deleteMode !== null} onOpenChange={() => setDeleteMode(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteMode === "one"
                  ? "Are you sure you want to delete this instance of the recurring call?"
                  : "Are you sure you want to delete the entire recurring call series?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={handleCancel}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
