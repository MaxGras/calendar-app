-- Disable RLS temporarily for profile inserts by admin
-- The issue is that even service-role needs policies defined
-- Solution: Remove all policies and add a bypass-friendly one

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "profiles: authenticated users can read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can delete" ON public.profiles;

-- Disable RLS on profiles table - admin operations should work without it
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with only a basic SELECT policy for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read all profiles (needed for UI dropdowns)
CREATE POLICY "profiles: all authenticated can read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- No policies for INSERT/UPDATE/DELETE - service role will handle these
