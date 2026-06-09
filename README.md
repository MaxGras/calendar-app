# CallDesk — Developer Call Scheduling

A web app for managing developer availability and scheduling calls. Sales managers can book calls with developers, and the system automatically prevents double-bookings.

## Features

- **Three user roles:**
  - Admin: Create accounts, manage users, appoint other admins
  - Sales Manager: Schedule calls with developers, view their availability
  - Developer: View your own schedule (read-only)

- **Smart scheduling:**
  - Week-view calendar with hourly slots
  - Real-time overlap detection at the database level
  - One-click booking with title, notes, and duration
  - No overlapping calls allowed (enforced by DB constraint)

- **Account management:**
  - Admin-only account creation (no public signup)
  - Role-based access control at the database level (RLS)
  - Activate/deactivate accounts without deletion
  - First admin is hardcoded (via Supabase Auth)

## Tech Stack

- **Frontend:** Next.js (App Router), React 19, TypeScript
- **UI:** shadcn/ui, Tailwind CSS
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Auth:** Supabase Auth (email/password)

## Quick Start

### 1. Set Up Supabase

Follow the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide to:
- Create a Supabase project
- Get your API keys
- Run the database schema SQL
- Create the admin user

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the template and fill in your Supabase keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run the App

```bash
npm dev
```

Visit `http://localhost:3000`

## Default Credentials

- Email: `admin@example.com`
- Password: `admin123456`

(Created during Supabase setup — change password after first login in production)

## Project Structure

```
app/
├── auth/          # Login page, auth callback
├── admin/         # Admin dashboard (account management)
├── manager/       # Sales manager dashboard (scheduling)
├── developer/     # Developer dashboard (read-only schedule)
├── actions/       # Server actions (bookCall, cancelCall, admin functions)
└── layout.tsx     # Root layout

components/
├── admin/         # Admin-specific components
├── manager/       # Manager-specific components (dialogs)
├── ui/            # shadcn/ui components
└── dashboard-shell.tsx  # Shared header/nav

lib/
├── auth.ts        # Auth helpers (getCurrentProfile, requireRole)
├── types.ts       # TypeScript interfaces
├── time.ts        # Date/time utilities
└── supabase/      # Supabase client setup
    ├── server.ts  # Server client (anon key, RLS)
    ├── admin.ts   # Service-role client (bypass RLS)
    ├── client.ts  # Browser client
    └── proxy.ts   # Middleware session refresh

middleware.ts      # Next.js middleware for session refresh
```

## How It Works

### Authentication & Authorization

1. Users log in via Supabase Auth (email/password)
2. Profile is created automatically via database trigger
3. Role stored in `profiles.role` (admin, sales_manager, developer)
4. RLS policies enforce role-based data access at the DB level

### Admin Operations

- Creating accounts goes through the **service-role client** (bypasses RLS)
- Allows admins to manage users without RLS restrictions
- Updates to `is_active`, `role` are protected by RLS policies for regular users

### Call Booking

- Sales managers select a developer and time slot
- System checks for conflicts at the database level
- If no overlap, call is inserted into `calls` table
- PostgreSQL **exclusion constraint** prevents overlaps (error code 23P01)
- Developers see read-only calendar of their calls

### Data Access

- **Managers/Admins:** Can see all calls via RLS policy `calls: managers and admins can read`
- **Developers:** Can only see their own calls via RLS policy `calls: developers can read own`
- **Profiles:** All authenticated users can read all profiles (needed for dropdowns)

## Database Schema

### profiles
```sql
id         uuid (PK, FK to auth.users)
email      text
full_name  text
role       text (admin, sales_manager, developer)
is_active  boolean
created_at timestamptz
```

### calls
```sql
id           uuid (PK)
developer_id uuid (FK to profiles)
created_by   uuid (FK to profiles, nullable)
title        text
notes        text
start_time   timestamptz
end_time     timestamptz
created_at   timestamptz

-- Constraints:
-- - end_time > start_time
-- - No overlaps for same developer (EXCLUDE USING gist)
```

## Testing Checklist

- [ ] Admin login works → lands on `/admin`
- [ ] Admin can create a developer account
- [ ] Developer login works → lands on `/developer`
- [ ] Developer dashboard shows their calls (read-only)
- [ ] Manager login works → lands on `/manager`
- [ ] Manager can select a developer and see their week
- [ ] Manager can book a call
- [ ] Booked call appears on calendar
- [ ] Trying to book overlapping time shows error
- [ ] Manager can cancel a call
- [ ] Manager can switch developers
- [ ] Admin can deactivate an account
- [ ] Deactivated user can't log in
- [ ] Admin can change a user's role

## Deployment

### Vercel

1. Push code to GitHub
2. Create new project on Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
4. Deploy

### Self-hosted

Requires Node.js 18+ and a reverse proxy (Nginx, etc.):

```bash
npm build
npm start
```

## RLS Policies

### profiles
- ✅ SELECT: Any authenticated user (used for dropdowns, profile lookup)
- ❌ INSERT/UPDATE/DELETE: None (all writes go through service-role client)

### calls
- ✅ SELECT: Managers/Admins can read all; Developers read only their own
- ✅ INSERT: Managers/Admins only
- ✅ DELETE: Managers/Admins only

## Known Limitations

- No timezone handling yet — all times are stored in UTC and displayed in browser local time
- No recurring calls (one-off calls only)
- No call templates or quick-book shortcuts
- No email notifications
- No integration with external calendars

## Security Notes

- Service-role key is server-only (never sent to browser)
- Anon key is safe to expose (row-level security protects data)
- RLS policies are enforced at the database layer
- Overlapping calls blocked at DB constraint level (not just UI)
- Admin user credentials are hardcoded for first login only (change in production)

## Troubleshooting

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database setup issues.

### "Relation does not exist" error
- Database schema wasn't created. Run the SQL from SUPABASE_SETUP.md.

### "Permission denied" on profile/call queries
- RLS policy might be too restrictive. Check that user's role is in `profiles` and role check is correct.

### Overlapping calls allowed
- Exclusion constraint might not exist. Verify in Supabase dashboard: Tables → calls → Constraints.

## Contributing

This is a single-developer scheduling app. Modifications should maintain:
- Role-based access control via RLS
- Database-level overlap prevention
- Minimal dependencies (shadcn/ui only)

## License

MIT
