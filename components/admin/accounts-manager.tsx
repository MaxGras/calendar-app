"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, UserPlus, ShieldCheck, Users, Code2 } from "lucide-react"
import type { Profile, Role } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/types"
import { createAccount, deleteAccount, setAccountActive, updateAccountRole } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AccountsManager({
  accounts,
  currentUserId,
}: {
  accounts: Profile[]
  currentUserId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const counts = useMemo(() => {
    return {
      total: accounts.length,
      managers: accounts.filter((a) => a.role === "sales_manager").length,
      developers: accounts.filter((a) => a.role === "developer").length,
    }
  }, [accounts])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total accounts" value={counts.total} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Sales managers" value={counts.managers} />
        <StatCard icon={<Code2 className="h-4 w-4" />} label="Developers" value={counts.developers} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Accounts</CardTitle>
          <CreateAccountDialog open={open} setOpen={setOpen} onDone={() => router.refresh()} />
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <AccountRow key={account.id} account={account} isSelf={account.id === currentUserId} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AccountRow({ account, isSelf }: { account: Profile; isSelf: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else if (res.success) toast.success(res.success)
      router.refresh()
    })
  }

  return (
    <TableRow className={pending ? "opacity-60" : undefined}>
      <TableCell className="pl-6 font-medium text-foreground">
        {account.full_name || "—"}
        {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
      </TableCell>
      <TableCell className="text-muted-foreground">{account.email}</TableCell>
      <TableCell>
        {isSelf ? (
          <Badge variant="secondary">{ROLE_LABELS[account.role]}</Badge>
        ) : (
          <Select
            value={account.role}
            onValueChange={(v) => v && run(() => updateAccountRole(account.id, v as Role))}
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sales_manager">Sales Manager</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={account.is_active}
            disabled={isSelf}
            onCheckedChange={(checked) => run(() => setAccountActive(account.id, checked))}
            aria-label="Toggle active"
          />
          <span className="text-xs text-muted-foreground">{account.is_active ? "Active" : "Inactive"}</span>
        </div>
      </TableCell>
      <TableCell className="pr-6 text-right">
        <DeleteAccountButton account={account} disabled={isSelf} onConfirm={() => run(() => deleteAccount(account.id))} />
      </TableCell>
    </TableRow>
  )
}

function DeleteAccountButton({
  account,
  disabled,
  onConfirm,
}: {
  account: Profile
  disabled: boolean
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" disabled={disabled} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete account</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            {`Permanently delete ${account.full_name || account.email}? This also removes their scheduled calls and cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateAccountDialog({
  open,
  setOpen,
  onDone,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [role, setRole] = useState<Role>("developer")

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("role", role)
    startTransition(async () => {
      const res = await createAccount(formData)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(res.success ?? "Account created.")
      setOpen(false)
      setRole("developer")
      onDone()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create account
          </DialogTitle>
          <DialogDescription>The user can sign in immediately with these credentials.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required placeholder="Jane Developer" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="jane@company.com" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="text" required minLength={8} placeholder="At least 8 characters" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="sales_manager">Sales Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
