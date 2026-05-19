create table if not exists public.product_variant_modifier_option_availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_option_id uuid not null references public.variant_group_options(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  is_available boolean not null default true,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, variant_group_option_id, modifier_option_id)
);

create index if not exists idx_pvmo_availability_business
  on public.product_variant_modifier_option_availability_rules(business_id);

create index if not exists idx_pvmo_availability_product
  on public.product_variant_modifier_option_availability_rules(product_id);

create index if not exists idx_pvmo_availability_variant_option
  on public.product_variant_modifier_option_availability_rules(variant_group_option_id);

create index if not exists idx_pvmo_availability_modifier_option
  on public.product_variant_modifier_option_availability_rules(modifier_option_id);

create index if not exists idx_pvmo_availability_modifier_group
  on public.product_variant_modifier_option_availability_rules(modifier_group_id);

drop trigger if exists set_product_variant_modifier_option_availability_rules_updated_at
on public.product_variant_modifier_option_availability_rules;

create trigger set_product_variant_modifier_option_availability_rules_updated_at
before update on public.product_variant_modifier_option_availability_rules
for each row execute function public.set_updated_at();
