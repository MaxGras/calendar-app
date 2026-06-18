-- Create app_settings table to store global application settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "app_settings: all authenticated can read"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Allow only admins to update settings (via service-role)
-- Service-role client will bypass this but it's good practice

-- Insert default timezone setting (GMT+2 - Kyiv)
INSERT INTO public.app_settings (key, value)
VALUES ('default_timezone', 'Europe/Kyiv')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
