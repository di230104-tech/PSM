-- Add 'lost' to asset status check constraint
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE public.assets ADD CONSTRAINT assets_status_check CHECK (status IN ('in_storage', 'checked_out', 'in_repair', 'retired', 'broken', 'Written Off', 'lost'));
