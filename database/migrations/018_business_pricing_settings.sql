begin;

create table if not exists public.business_pricing_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  pizza_half_topping_pricing_enabled boolean not null default true,
  pizza_half_topping_included_weight_enabled boolean not null default true,
  pizza_half_topping_rounding_mode text not null default 'floor_to_cent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_pricing_settings_business_id_key unique (business_id),
  constraint business_pricing_settings_rounding_mode_check
    check (pizza_half_topping_rounding_mode in ('floor_to_cent'))
);

alter table public.business_pricing_settings enable row level security;

drop policy if exists "business_pricing_settings_public_read"
  on public.business_pricing_settings;
drop policy if exists "business_pricing_settings_admin_manage"
  on public.business_pricing_settings;

create policy "business_pricing_settings_public_read"
on public.business_pricing_settings
for select
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_pricing_settings.business_id
  )
);

create policy "business_pricing_settings_admin_manage"
on public.business_pricing_settings
for all
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists set_business_pricing_settings_updated_at
  on public.business_pricing_settings;

create trigger set_business_pricing_settings_updated_at
before update on public.business_pricing_settings
for each row execute function public.set_updated_at();

commit;
