-- Add is_archived column to assets table for soft-delete archive
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Update existing 'retired' assets to be 'is_archived' if any
UPDATE public.assets SET is_archived = TRUE WHERE status = 'retired';
