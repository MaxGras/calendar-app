-- Allow authenticated users to update their own profile
CREATE POLICY "profiles: users can update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
