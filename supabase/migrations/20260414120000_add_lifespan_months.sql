-- Add lifespan_months to assets and draft_assets tables
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS lifespan_months INTEGER;
ALTER TABLE public.draft_assets ADD COLUMN IF NOT EXISTS lifespan_months INTEGER;

-- Update existing records to convert lifespan_years to lifespan_months
UPDATE public.assets SET lifespan_months = lifespan_years * 12 WHERE lifespan_months IS NULL AND lifespan_years IS NOT NULL;
UPDATE public.draft_assets SET lifespan_months = lifespan_years * 12 WHERE lifespan_months IS NULL AND lifespan_years IS NOT NULL;

-- Set default for future records
ALTER TABLE public.assets ALTER COLUMN lifespan_months SET DEFAULT 36;
ALTER TABLE public.draft_assets ALTER COLUMN lifespan_months SET DEFAULT 36;
