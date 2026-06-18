# CallDesk — Project Context for Claude Code

## Project Overview

CallDesk is a developer call scheduling app where sales managers book calls with developers, and admins manage accounts. The app is **fully implemented** at the code level but requires Supabase database setup to run.

**Status:** Ready to connect to Supabase. See `SUPABASE_SETUP.md` for configuration steps.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)

## Key Files & Patterns

### Authentication
- `lib/auth.ts` — `getCurrentProfile()`, `requireRole()`
- `app/auth/login/page.tsx` — Login form + role-based redirect
- `middleware.ts` — Session refresh on every request

### Data Access
- `lib/supabase/server.ts` — Anon-key client (RLS enforced)
- `lib/supabase/admin.ts` — Service-role client (bypass RLS for admin ops)
- No direct database access; everything goes through Supabase client

### Database
- `profiles` — Users with role, is_active, email, full_name, color
- `calls` — Scheduled calls with developer_id, start/end times
- `recurring_calls` — Recurring call templates with repeat_type, repeat_days, hour, minute, duration_minutes
- `recurring_call_exceptions` — Exceptions/cancellations for specific recurring call instances
- `app_settings` — Global app settings (e.g., default_timezone)
- Exclusion constraint prevents overlapping calls (error code 23P01)
- RLS policies enforce role-based access

### Forms & State
- Prefer `useTransition()` + server actions for form submission
- Use controlled inputs (`useState()`)
- Show errors via `toast.error()`, success via `toast.success()`
- Dialogs managed with `useState(open)` + `Dialog` component

## Codebase Conventions

### Naming
- Components: PascalCase, e.g., `BookCallDialog`
- Functions: camelCase, e.g., `formatDateTime()`
- Files: kebab-case dirs, PascalCase components, camelCase functions
- Types: `Type`, e.g., `Profile`, `Call`, `Role`

### Imports
```typescript
import { functionName } from "@/path"  // Use @/ alias
import type { TypeName } from "@/path" // Explicit type imports
```

### Server vs Client
- Server components: `export default async function Page()` (in app/)
- Client components: `"use client"` at top (in components/)
- Server actions: `"use server"` at top (in app/actions/)
- Middleware: `export async function middleware()`

### Error Handling
- Server actions return `{ error?: string; success?: string }`
- UI catches errors via `toast.error(res.error)`
- Database constraints (RLS, overlap) caught at action level
- No error boundaries yet; errors surface as toasts

### Styling
- Tailwind classes directly on elements
- shadcn/ui components for form fields, dialogs, tables
- No custom CSS files; all Tailwind
- Responsive: mobile-first with `sm:` breakpoints

## Role-Based Access

### Admin
- Can create/delete/deactivate accounts with email/password (min 4 chars)
- Can change user roles
- Can set global app timezone (stored in app_settings)
- Can delete developers and sales managers from admin tables
- Lands on `/admin`
- Uses service-role client (bypasses RLS)

### Sales Manager
- Can book and cancel calls
- Can see all developers and their schedules
- Can delete recurring calls assigned to them (single instance or entire series)
- Lands on `/manager`
- Can view week-view calendar with current time indicator
- Manager color displayed on recurring call instances they're assigned to

### Developer
- Can see their own calls and recurring calls
- Can create recurring calls (daily, weekly, biweekly, custom)
- Can assign recurring calls to optional sales manager
- Can delete their own recurring calls (single instance or entire series)
- Lands on `/developer`
- Cannot book or cancel one-time calls (read-only for those)

## Routing & Redirects

- `/` — Home (redirects to role dashboard)
- `/auth/login` — Login page
- `/admin` — Admin dashboard (requires admin role)
  - Tabs: Developers, Sales Managers, Settings
- `/manager` — Sales manager calendar (requires manager role)
- `/developer` — Developer schedule (requires developer role)
- `/auth/callback` — OAuth callback from Supabase

All protected routes use `requireRole()` helper which redirects non-matching users to their own dashboard.

## Recurring Calls Feature

### Creation (Developer)
- Developers can create recurring calls from `/developer` page
- Options: daily, weekly, biweekly, custom (select specific days)
- Set: title, call link, duration (15-120 min), time
- Optional: assign to sales manager
- Validation: checks for time conflicts with existing calls/recurring calls

### Display (Manager Calendar)
- Recurring call instances generated for the week
- Display with diagonal stripe pattern to distinguish from one-time calls
- Color: based on assigned sales manager, or developer's color if not assigned
- Show manager's name as "Created by" 

### Deletion
- Developer can delete: entire series or single instance only
- Sales Manager (if assigned): can delete entire series or single instance only
- Confirmation dialog shows what will be deleted
- Single instance cancellations stored in `recurring_call_exceptions` table

### Calendar Features
- Current time indicator (red line) on today's column
- Past time slots: light gray background
- Past recurring calls: 40% opacity but still visible
- Calls display in default app timezone (set by admin)

## Timezone Support

- **Admin Settings:** New "Settings" tab allows admin to set default timezone
- **Storage:** Default timezone stored in `app_settings` table
- **Default:** GMT+2 (Europe/Kyiv) by default
- **Validation:** Uses IANA timezone format (e.g., Europe/Paris, America/New_York)
- **Audit:** Records who changed timezone and when
- **Database:** All times stored as UTC in database, displayed in selected timezone

## Common Tasks

### Add a New Component
1. Create file in `components/` or `components/admin/` or `components/manager/`
2. Mark as `"use client"` if it uses React hooks
3. Use shadcn/ui components for inputs, dialogs, buttons
4. Import types from `@/lib/types`

### Add a New Server Action
1. Create in `app/actions/`
2. Mark with `"use server"` at top
3. Return `{ error?: string; success?: string }`
4. Call it from client component via `useTransition()`
5. Show feedback via `toast.error()` or `toast.success()`

### Query the Database
1. Use `createClient()` from `@/lib/supabase/server` (server component/action only)
2. Use RLS-compliant queries: `.from("table").select(...)`
3. Never construct raw SQL
4. Always handle `.error` in the response

### Add RLS Policy
1. Go to Supabase SQL Editor
2. Create policy on table with `CREATE POLICY ...`
3. Use `public.current_role_is('role')` helper function
4. Test by logging in as that role

## Testing Workflow

1. Start with `npm dev`
2. Login as admin@example.com / admin123456
3. Create a developer, manager account
4. Test booking, cancellation, overlap prevention
5. Check Supabase dashboard: Tables → calls to verify data

## Debugging Tips

- `npm run dev` with `--debug` flag for verbose logging
- Check browser console (F12 → Console)
- Check Supabase logs: Dashboard → Logs → Auth, Database
- Add `console.log()` in server actions (visible in terminal)
- Use DevTools Network tab to see RLS errors
- Query Supabase SQL Editor to inspect data directly

## Known Quirks & Features

- **Timezone:** Times stored as UTC, displayed in app-wide timezone set by admin. Default is GMT+2 (Kyiv).
- **Recurring Calls:** Generated instances not stored individually; calculated from template on display. Single exceptions stored in `recurring_call_exceptions` table.
- **Overlap check:** UI checks locally; DB enforces with constraint on one-time calls only. Rare race condition possible but caught and surfaced as error.
- **RLS:** Developers can't see other developers' calls by design. Admin sees all via service-role client. RLS disabled on profiles table to allow admin user creation.
- **Passwords:** No password reset flow; admin must deactivate and recreate. Minimum 4 characters (not 8).
- **Delete Dialogs:** Recurring call delete opens separate modal (not nested) to prevent overlapping dialogs.
- **Manager Assignment:** Optional on recurring calls; if none assigned, uses developer's color for display.
- **Sales Manager Access:** Can only see/manage recurring calls assigned to them (authorization checked server-side).

## Git & Commits

- Commit messages: "Add feature X", "Fix bug in Y", "Update docs for Z"
- Single-file changes: Don't need detailed message
- Multi-file refactors: Explain "why" in commit body
- Run tests before pushing (once test suite is added)

## Environment Variables

Required for local dev:
```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Do NOT commit `.env.local` — it's in `.gitignore`.

## Performance Notes

- Calendar week-view: O(1) to O(n) where n = calls that week
- No pagination yet (assume < 1000 calls per developer)
- RLS policies evaluated per query (minimal overhead)
- Overlap detection: O(n) in-memory for UI; O(1) via DB constraint

## What NOT to Do

1. Don't add public signup flow (admin-only account creation by design)
2. Don't query `auth.users` directly (use `profiles` table instead)
3. Don't disable RLS policies (they enforce role-based access)
4. Don't store service-role key in browser env vars (only in backend)
5. Don't add timestamps without `timestamptz` type (DST issues)
6. Don't skip the overlap constraint (data integrity)

## Implemented Features

- ✅ Recurring calls (daily, weekly, biweekly, custom)
- ✅ Timezone support (admin-wide setting, default GMT+2)
- ✅ Current time indicator on calendar
- ✅ Admin user management (create/delete developers and sales managers)
- ✅ Delete recurring call instances or entire series
- ✅ Optional sales manager assignment on recurring calls
- ✅ Color-coded calls based on manager/developer

## Future Improvements

- Add user-level timezone preferences (override admin default)
- Add email notifications (Resend, SendGrid)
- Add call notes/history (past calls with summaries)
- Add call status (scheduled, completed, no-show)
- Add bulk operations (delete multiple users, reschedule calls)
- Mobile app (React Native or Flutter)
- Analytics dashboard (calls booked, cancellation rate, etc.)
- Add password reset flow
- Add call reminders (24h, 1h before call)

## Links & Docs

- [README.md](./README.md) — Project overview
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — Database configuration
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) — What's done, what's left
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- shadcn/ui components: https://ui.shadcn.com

---

**Last Updated:** 2026-06-18  
**Status:** Fully implemented with recurring calls, timezone settings, and admin management
