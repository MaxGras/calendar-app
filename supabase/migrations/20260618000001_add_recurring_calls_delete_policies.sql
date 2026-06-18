-- Add RLS policies to allow managers and admins to delete recurring calls

-- Allow admins to delete all recurring calls
CREATE POLICY "recurring_calls: admins can delete all"
  ON public.recurring_calls FOR DELETE
  TO authenticated
  USING (
    public.current_role_is('admin')
  );

-- Allow managers to delete recurring calls assigned to them
CREATE POLICY "recurring_calls: managers can delete assigned"
  ON public.recurring_calls FOR DELETE
  TO authenticated
  USING (
    public.current_role_is('sales_manager')
    AND sales_manager_id = auth.uid()
  );
