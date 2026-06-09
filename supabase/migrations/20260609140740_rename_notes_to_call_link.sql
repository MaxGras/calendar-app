-- Rename notes column to call_link for clarity
-- The column stores the job description or call details link

ALTER TABLE public.calls
RENAME COLUMN notes TO call_link;

-- Update comment
COMMENT ON COLUMN public.calls.call_link IS 'Link to job description, call details, or other relevant information for this call';
