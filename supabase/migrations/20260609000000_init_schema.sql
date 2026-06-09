-- CallDesk Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable required extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  full_name  text NOT NULL DEFAULT '',
  role       text NOT NULL CHECK (role IN ('admin', 'sales_manager', 'developer')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Auto-create profile when new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'developer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CALLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Call',
  call_link    text NOT NULL DEFAULT '',
  vacancy_link text NOT NULL DEFAULT '',
  salary       text NOT NULL DEFAULT '',
  start_time   timestamptz NOT NULL,
  end_time     timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Ensure end time is after start time
  CONSTRAINT calls_end_after_start CHECK (end_time > start_time),

  -- Prevent overlapping calls for the same developer
  -- Triggers error code 23P01 on violation
  CONSTRAINT calls_no_overlap EXCLUDE USING gist (
    developer_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calls_developer_id ON public.calls(developer_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_by ON public.calls(created_by);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON public.calls(start_time);
CREATE INDEX IF NOT EXISTS idx_calls_end_time ON public.calls(end_time);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Helper function to check user's role
CREATE OR REPLACE FUNCTION public.current_role_is(r text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = r AND is_active = true
  );
$$;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

-- Any authenticated user can read all profiles
-- (needed for dropdowns, role lookups, etc.)
DROP POLICY IF EXISTS "profiles: authenticated users can read all" ON public.profiles;
CREATE POLICY "profiles: authenticated users can read all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for profiles
-- All writes happen via service-role client in admin actions

-- ============================================================================
-- CALLS RLS POLICIES
-- ============================================================================

-- Sales managers and admins can read all calls
DROP POLICY IF EXISTS "calls: managers and admins can read" ON public.calls;
CREATE POLICY "calls: managers and admins can read"
  ON public.calls FOR SELECT
  TO authenticated
  USING (
    public.current_role_is('sales_manager') OR public.current_role_is('admin')
  );

-- Developers can read only their own calls
DROP POLICY IF EXISTS "calls: developers can read own" ON public.calls;
CREATE POLICY "calls: developers can read own"
  ON public.calls FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid() AND public.current_role_is('developer')
  );

-- Sales managers and admins can insert calls
DROP POLICY IF EXISTS "calls: managers and admins can insert" ON public.calls;
CREATE POLICY "calls: managers and admins can insert"
  ON public.calls FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_role_is('sales_manager') OR public.current_role_is('admin')
  );

-- Sales managers and admins can delete calls
DROP POLICY IF EXISTS "calls: managers and admins can delete" ON public.calls;
CREATE POLICY "calls: managers and admins can delete"
  ON public.calls FOR DELETE
  TO authenticated
  USING (
    public.current_role_is('sales_manager') OR public.current_role_is('admin')
  );

-- ============================================================================
-- DONE
-- ============================================================================

-- Schema is now ready for use!
-- Next: Create the admin user in Supabase Auth and run the seed script
