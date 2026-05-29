create table if not exists public.product_variant_modifier_option_price_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_option_id uuid not null references public.variant_group_options(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  price_delta numeric(10,2) not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    product_id,
    variant_group_option_id,
    modifier_group_id,
    modifier_option_id
  )
);

create index if not exists idx_pvmo_price_overrides_business
  on public.product_variant_modifier_option_price_overrides(business_id);

create index if not exists idx_pvmo_price_overrides_product
  on public.product_variant_modifier_option_price_overrides(product_id);

create index if not exists idx_pvmo_price_overrides_variant_option
  on public.product_variant_modifier_option_price_overrides(variant_group_option_id);

create index if not exists idx_pvmo_price_overrides_modifier_group
  on public.product_variant_modifier_option_price_overrides(modifier_group_id);

create index if not exists idx_pvmo_price_overrides_modifier_option
  on public.product_variant_modifier_option_price_overrides(modifier_option_id);

drop trigger if exists set_product_variant_modifier_option_price_overrides_updated_at
on public.product_variant_modifier_option_price_overrides;

create trigger set_product_variant_modifier_option_price_overrides_updated_at
before update on public.product_variant_modifier_option_price_overrides
for each row execute function public.set_updated_at();
