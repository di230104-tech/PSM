-- Update asset status technical values to pretty names
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

-- Update existing records to new pretty names
UPDATE public.assets SET status = 'Available' WHERE status = 'in_storage';
UPDATE public.assets SET status = 'In Use' WHERE status = 'checked_out';
UPDATE public.assets SET status = 'In Repair' WHERE status = 'in_repair';
UPDATE public.assets SET status = 'Broken' WHERE status = 'broken';
UPDATE public.assets SET status = 'Written-Off' WHERE status = 'Written Off';
UPDATE public.assets SET status = 'Lost/Stolen' WHERE status = 'lost';

-- Re-add constraint with new approved values
ALTER TABLE public.assets ADD CONSTRAINT assets_status_check CHECK (status IN ('Available', 'In Use', 'In Repair', 'Broken', 'Written-Off', 'Lost/Stolen', 'Retired', 'draft'));
