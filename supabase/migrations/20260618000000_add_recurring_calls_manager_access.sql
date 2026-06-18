-- Add RLS policies to allow managers and admins to read recurring calls

-- Allow sales managers and admins to read recurring calls
CREATE POLICY "recurring_calls: managers and admins can read"
  ON public.recurring_calls FOR SELECT
  TO authenticated
  USING (
    public.current_role_is('sales_manager') OR public.current_role_is('admin')
  );

-- Allow managers and admins to manage exceptions for recurring calls
CREATE POLICY "exceptions: managers and admins can read"
  ON public.recurring_call_exceptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_calls
      WHERE id = recurring_call_exceptions.recurring_call_id
      AND (public.current_role_is('sales_manager') OR public.current_role_is('admin'))
    )
  );
