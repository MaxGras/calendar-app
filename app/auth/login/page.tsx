"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CalendarClock, Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const inactiveError = params.get("error") === "inactive" ? "Your account has been deactivated. Contact an admin." : null

  async function onSubmit(values: LoginFormValues) {
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (signInError) {
      form.setError("root", { message: signInError.message })
      return
    }

    // Look up role to route to the correct dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single()

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut()
      form.setError("root", { message: "Your account is inactive. Contact an admin." })
      return
    }

    const path =
      profile.role === "admin" ? "/admin" : profile.role === "sales_manager" ? "/manager" : "/developer"
    router.replace(path)
    router.refresh()
  }

  const rootError = form.formState.errors.root

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">CallDesk</h1>
            <p className="text-sm text-muted-foreground">Developer call scheduling</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the credentials provided by your administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {inactiveError ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {inactiveError}
                  </p>
                ) : null}

                {rootError ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {rootError.message}
                  </p>
                ) : null}

                <Button type="submit" disabled={form.formState.isSubmitting} className="mt-1">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {"Seed admin — admin@example.com / admin123456"}
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
