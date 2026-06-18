"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createAccount } from "@/app/actions/admin"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AddUserDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: "developer" | "sales_manager"
}) {
  const [pending, startTransition] = useTransition()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast.error("Full name is required")
      return
    }

    if (!email.trim()) {
      toast.error("Email is required")
      return
    }

    if (!password || password.length < 4) {
      toast.error("Password must be at least 4 characters")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("full_name", fullName)
      formData.set("email", email)
      formData.set("password", password)
      formData.set("role", role)

      const res = await createAccount(formData)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success || "User created successfully")
        setFullName("")
        setEmail("")
        setPassword("")
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {role === "developer" ? "Developer" : "Sales Manager"}</DialogTitle>
          <DialogDescription>
            Create a new {role === "developer" ? "developer" : "sales manager"} account with email and password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={pending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 4 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 4 characters</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
