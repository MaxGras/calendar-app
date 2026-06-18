-- Fix RLS policy for profiles table to allow admin insertions
-- The service role should bypass RLS, but we need to ensure no policies are blocking it

-- First, let's check if there are any existing INSERT/UPDATE/DELETE policies and drop them
DROP POLICY IF EXISTS "profiles: admins can insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can delete" ON public.profiles;

-- Ensure RLS is enabled (it should be)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Only the SELECT policy should exist - reads are restricted by role
-- All writes go through service-role client which bypasses RLS
-- No INSERT/UPDATE/DELETE policies needed because service-role bypasses RLS entirely
