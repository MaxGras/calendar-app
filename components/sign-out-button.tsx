"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"

export function SignOutButton() {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  )
}
