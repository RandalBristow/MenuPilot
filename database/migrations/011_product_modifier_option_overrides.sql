create table if not exists public.product_modifier_option_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  price_delta_override numeric(10,2),
  prep_time_delta_minutes_override integer,
  is_enabled boolean,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, modifier_option_id)
);

create index if not exists idx_product_modifier_option_overrides_business
  on public.product_modifier_option_overrides(business_id);

create index if not exists idx_product_modifier_option_overrides_product
  on public.product_modifier_option_overrides(product_id);

create index if not exists idx_product_modifier_option_overrides_option
  on public.product_modifier_option_overrides(modifier_option_id);

drop trigger if exists set_product_modifier_option_overrides_updated_at
on public.product_modifier_option_overrides;

create trigger set_product_modifier_option_overrides_updated_at
before update on public.product_modifier_option_overrides
for each row execute function public.set_updated_at();
