-- Add duration_minutes column to recurring_calls
ALTER TABLE public.recurring_calls
ADD COLUMN duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 480);

-- Update the comment
COMMENT ON COLUMN public.recurring_calls.duration_minutes IS 'Duration of the call in minutes (default 60)';
