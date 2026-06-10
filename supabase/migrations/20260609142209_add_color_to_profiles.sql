-- Add color field to profiles table for sales manager customization
ALTER TABLE public.profiles
ADD COLUMN color text DEFAULT '#8B5CF6';

COMMENT ON COLUMN public.profiles.color IS 'Hex color code for this user (used in calendar for call identification)';
