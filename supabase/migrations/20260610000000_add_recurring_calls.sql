-- Add recurring calls table for developers to set up recurring calls

CREATE TABLE public.recurring_calls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sales_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Recurring Call',
  call_link    text NOT NULL DEFAULT '',
  repeat_type  text NOT NULL CHECK (repeat_type IN ('daily', 'weekly', 'biweekly', 'custom')),
  repeat_days  text[] DEFAULT ARRAY[]::text[], -- For custom: ['Mon', 'Wed', 'Fri']
  repeat_interval text DEFAULT 'weekly', -- 'weekly' or 'biweekly' for custom
  hour         int NOT NULL CHECK (hour >= 0 AND hour < 24),
  minute       int NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute < 60),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_recurring_calls_developer_id ON public.recurring_calls(developer_id);
CREATE INDEX idx_recurring_calls_sales_manager_id ON public.recurring_calls(sales_manager_id);
CREATE INDEX idx_recurring_calls_is_active ON public.recurring_calls(is_active);

-- Enable RLS on recurring_calls
ALTER TABLE public.recurring_calls ENABLE ROW LEVEL SECURITY;

-- Developers can read their own recurring calls
CREATE POLICY "recurring_calls: developers can read own"
  ON public.recurring_calls FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid() AND public.current_role_is('developer')
  );

-- Developers can create their own recurring calls
CREATE POLICY "recurring_calls: developers can insert own"
  ON public.recurring_calls FOR INSERT
  TO authenticated
  WITH CHECK (
    developer_id = auth.uid() AND public.current_role_is('developer')
  );

-- Developers can update their own recurring calls
CREATE POLICY "recurring_calls: developers can update own"
  ON public.recurring_calls FOR UPDATE
  TO authenticated
  USING (
    developer_id = auth.uid() AND public.current_role_is('developer')
  );

-- Developers can delete their own recurring calls
CREATE POLICY "recurring_calls: developers can delete own"
  ON public.recurring_calls FOR DELETE
  TO authenticated
  USING (
    developer_id = auth.uid() AND public.current_role_is('developer')
  );
