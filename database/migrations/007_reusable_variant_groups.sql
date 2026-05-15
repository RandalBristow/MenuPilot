create table public.variant_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table public.variant_group_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  variant_group_id uuid not null references public.variant_groups(id) on delete cascade,
  name text not null,
  variant_type text,
  unit_type text,
  unit_quantity numeric,
  unit_label text,
  base_price numeric(10,2) not null default 0,
  prep_time_minutes integer,
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_group_id, name)
);

create table public.product_variant_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_id uuid not null references public.variant_groups(id) on delete restrict,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, variant_group_id)
);

create table public.product_variant_option_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_option_id uuid not null references public.variant_group_options(id) on delete cascade,
  price_override numeric(10,2),
  prep_time_minutes_override integer,
  is_enabled boolean,
  is_default boolean,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, variant_group_option_id)
);

create index idx_variant_groups_business on public.variant_groups(business_id);
create index idx_variant_group_options_business on public.variant_group_options(business_id);
create index idx_variant_group_options_group on public.variant_group_options(variant_group_id);
create index idx_product_variant_groups_business on public.product_variant_groups(business_id);
create index idx_product_variant_groups_product on public.product_variant_groups(product_id);
create index idx_product_variant_groups_group on public.product_variant_groups(variant_group_id);
create index idx_product_variant_option_overrides_business on public.product_variant_option_overrides(business_id);
create index idx_product_variant_option_overrides_product on public.product_variant_option_overrides(product_id);
create index idx_product_variant_option_overrides_option on public.product_variant_option_overrides(variant_group_option_id);

create trigger set_variant_groups_updated_at before update on public.variant_groups
for each row execute function public.set_updated_at();

create trigger set_variant_group_options_updated_at before update on public.variant_group_options
for each row execute function public.set_updated_at();

create trigger set_product_variant_groups_updated_at before update on public.product_variant_groups
for each row execute function public.set_updated_at();

create trigger set_product_variant_option_overrides_updated_at before update on public.product_variant_option_overrides
for each row execute function public.set_updated_at();

with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
seed_groups as (
  select
    b.business_id,
    x.name,
    x.description,
    x.sort_order
  from b
  cross join (
    values
      ('Pizza Sizes', 'Reusable pizza size choices.', 1),
      ('Drink Sizes', 'Reusable drink size choices.', 2),
      ('Wing Counts', 'Reusable wing count choices.', 3)
  ) as x(name, description, sort_order)
),
upserted_groups as (
  insert into public.variant_groups (
    business_id,
    name,
    description,
    is_enabled,
    sort_order
  )
  select
    business_id,
    name,
    description,
    true,
    sort_order
  from seed_groups
  on conflict (business_id, name) do update
  set
    description = excluded.description,
    is_enabled = excluded.is_enabled,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id, business_id, name
),
all_groups as (
  select id, business_id, name
  from upserted_groups

  union

  select vg.id, vg.business_id, vg.name
  from public.variant_groups vg
  join seed_groups sg
    on sg.business_id = vg.business_id
   and sg.name = vg.name
),
seed_options as (
  select
    g.business_id,
    g.id as variant_group_id,
    x.name,
    x.variant_type,
    x.unit_type,
    x.unit_quantity,
    x.unit_label,
    x.base_price,
    x.prep_time_minutes,
    x.is_default,
    x.sort_order
  from all_groups g
  join (
    values
      ('Pizza Sizes', '10"', 'size', 'diameter', 10::numeric, 'inch', 8.99::numeric, 0, true, 1),
      ('Pizza Sizes', '12"', 'size', 'diameter', 12::numeric, 'inch', 11.99::numeric, 0, false, 2),
      ('Pizza Sizes', '14"', 'size', 'diameter', 14::numeric, 'inch', 14.99::numeric, 0, false, 3),
      ('Pizza Sizes', '16"', 'size', 'diameter', 16::numeric, 'inch', 17.99::numeric, 0, false, 4),
      ('Drink Sizes', '20 oz', 'size', 'volume', 20::numeric, 'oz', 2.49::numeric, 0, true, 1),
      ('Drink Sizes', '2 Liter', 'size', 'volume', 2::numeric, 'liter', 3.49::numeric, 0, false, 2),
      ('Wing Counts', '6 Wings', 'count', 'count', 6::numeric, 'wings', 7.99::numeric, 0, true, 1),
      ('Wing Counts', '12 Wings', 'count', 'count', 12::numeric, 'wings', 13.99::numeric, 0, false, 2),
      ('Wing Counts', '24 Wings', 'count', 'count', 24::numeric, 'wings', 25.99::numeric, 0, false, 3)
  ) as x(
    group_name,
    name,
    variant_type,
    unit_type,
    unit_quantity,
    unit_label,
    base_price,
    prep_time_minutes,
    is_default,
    sort_order
  )
    on x.group_name = g.name
)
insert into public.variant_group_options (
  business_id,
  variant_group_id,
  name,
  variant_type,
  unit_type,
  unit_quantity,
  unit_label,
  base_price,
  prep_time_minutes,
  is_default,
  is_enabled,
  sort_order
)
select
  business_id,
  variant_group_id,
  name,
  variant_type,
  unit_type,
  unit_quantity,
  unit_label,
  base_price,
  prep_time_minutes,
  is_default,
  true,
  sort_order
from seed_options
on conflict (variant_group_id, name) do update
set
  variant_type = excluded.variant_type,
  unit_type = excluded.unit_type,
  unit_quantity = excluded.unit_quantity,
  unit_label = excluded.unit_label,
  base_price = excluded.base_price,
  prep_time_minutes = excluded.prep_time_minutes,
  is_default = excluded.is_default,
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order,
  updated_at = now();
