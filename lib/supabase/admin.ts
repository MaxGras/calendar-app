import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Service-role client. SERVER ONLY. Bypasses RLS.
// Used by admins to create/delete auth users.
export async function createAdminClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // no-op: admin client should never mutate the session cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
