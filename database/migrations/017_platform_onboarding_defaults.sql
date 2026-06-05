begin;

-- Minimal Platform Admin onboarding support.
-- Most changes affect defaults for newly-created records only. Existing
-- locations are marked active so the new status column does not make current
-- demo data look like setup data.

alter table public.businesses
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_email text,
  add column if not exists primary_phone text;

alter table public.businesses
  alter column status set default 'setup';

alter table public.locations
  add column if not exists status text;

-- Preserve existing locations as active while new locations start in setup.
update public.locations
set status = 'active'
where status is null;

alter table public.locations
  alter column status set default 'setup',
  alter column status set not null,
  alter column is_enabled set default false,
  alter column accepting_orders set default false,
  alter column pickup_enabled set default false,
  alter column delivery_enabled set default false;

commit;
