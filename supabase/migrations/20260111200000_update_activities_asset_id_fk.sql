-- Drop the existing foreign key constraint
alter table public.activities drop constraint if exists activities_asset_id_fkey;

-- Add a new foreign key constraint with ON DELETE SET NULL
alter table public.activities
add constraint activities_asset_id_fkey
foreign key (asset_id)
references public.assets (asset_tag)
on delete set null;
