-- Enable creator tracking for calls
-- The calls table already has a created_by field that references profiles(id)
-- This migration documents the feature being actively used:
-- - Track which sales manager created each call
-- - Restrict deletion to only the creator
-- - Hide job description link from sales managers in the UI

-- Add a comment to the calls table documenting the creator relationship
COMMENT ON COLUMN public.calls.created_by IS 'References the sales manager who created this call. Used for tracking ownership and enforcing delete permissions.';

-- Verify the foreign key exists
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name = 'calls' AND constraint_type = 'FOREIGN KEY';

-- Verify the index exists for performance
-- SELECT indexname FROM pg_indexes WHERE tablename = 'calls' AND indexname = 'idx_calls_created_by';

-- All set! The database is ready for creator tracking.
