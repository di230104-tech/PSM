-- Update asset status check constraint to include 'Written Off'
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE public.assets ADD CONSTRAINT assets_status_check CHECK (status IN ('in_storage', 'checked_out', 'in_repair', 'retired', 'broken', 'Written Off'));

-- Update existing retired/archived assets to 'Written Off' for consistency if desired
-- UPDATE public.assets SET status = 'Written Off' WHERE status = 'retired' OR is_archived = TRUE;
