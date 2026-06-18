-- Track canceled instances of recurring calls (don't delete the recurring call, just skip this date)
CREATE TABLE public.recurring_call_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_call_id uuid NOT NULL REFERENCES public.recurring_calls(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recurring_call_id, exception_date)
);

-- Create index for fast lookups
CREATE INDEX idx_recurring_call_exceptions_recurring_id ON public.recurring_call_exceptions(recurring_call_id);
CREATE INDEX idx_recurring_call_exceptions_date ON public.recurring_call_exceptions(exception_date);

-- Enable RLS
ALTER TABLE public.recurring_call_exceptions ENABLE ROW LEVEL SECURITY;

-- Developers can manage exceptions for their own recurring calls
CREATE POLICY "exceptions: developers can manage own"
  ON public.recurring_call_exceptions FOR ALL
  TO authenticated
  USING (
    recurring_call_id IN (
      SELECT id FROM public.recurring_calls 
      WHERE developer_id = auth.uid() AND public.current_role_is('developer')
    )
  );
