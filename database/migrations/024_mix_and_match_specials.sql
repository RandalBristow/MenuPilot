begin;

alter table public.specials
drop constraint if exists specials_special_type_check;

alter table public.specials
add constraint specials_special_type_check
  check (special_type in (
    'line_discount',
    'fixed_price_line',
    'cart_discount',
    'orderable_deal',
    'mix_and_match_fixed_unit_price'
  ));

create table if not exists public.special_mix_match_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  min_quantity integer not null default 2,
  max_quantity integer,
  unit_price numeric(10,2) not null,
  allow_extra_items boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_mix_match_rules_special_unique
    unique (special_id),
  constraint special_mix_match_rules_min_quantity_positive_check
    check (min_quantity > 0),
  constraint special_mix_match_rules_max_quantity_check
    check (max_quantity is null or max_quantity >= min_quantity),
  constraint special_mix_match_rules_unit_price_nonnegative_check
    check (unit_price >= 0)
);

create table if not exists public.special_mix_match_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint special_mix_match_products_unique
    unique (special_id, product_id)
);

create table if not exists public.special_mix_match_product_variant_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_mix_match_product_id uuid not null references public.special_mix_match_products(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_option_id uuid not null references public.variant_group_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint special_mix_match_product_variant_options_unique
    unique (special_mix_match_product_id, variant_group_option_id)
);

create table if not exists public.special_mix_match_modifier_group_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_mix_match_product_id uuid not null references public.special_mix_match_products(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  included_selection_count numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_mix_match_modifier_group_overrides_unique
    unique (special_mix_match_product_id, modifier_group_id),
  constraint special_mix_match_modifier_group_overrides_count_nonnegative_check
    check (included_selection_count >= 0)
);

create or replace function public.validate_special_mix_match_rule_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.specials s
    where s.id = new.special_id
      and s.business_id = new.business_id
      and s.special_type = 'mix_and_match_fixed_unit_price'
  ) then
    raise exception 'Mix-and-match rule must match a mix-and-match special in the same business.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_special_mix_match_product_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.specials s
    where s.id = new.special_id
      and s.business_id = new.business_id
      and s.special_type = 'mix_and_match_fixed_unit_price'
  ) then
    raise exception 'Mix-and-match product must match a mix-and-match special in the same business.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.business_id = new.business_id
  ) then
    raise exception 'Mix-and-match product must match the product business.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_special_mix_match_product_variant_option_scope()
returns trigger
language plpgsql
as $$
declare
  option_variant_group_id uuid;
begin
  if not exists (
    select 1
    from public.special_mix_match_products smmp
    where smmp.id = new.special_mix_match_product_id
      and smmp.business_id = new.business_id
      and smmp.special_id = new.special_id
      and smmp.product_id = new.product_id
  ) then
    raise exception 'Mix-and-match product variant restriction must match the mix product.';
  end if;

  select vgo.variant_group_id
  into option_variant_group_id
  from public.variant_group_options vgo
  where vgo.id = new.variant_group_option_id
    and vgo.business_id = new.business_id;

  if option_variant_group_id is null then
    raise exception 'Mix-and-match product variant restriction must match the business.';
  end if;

  if not exists (
    select 1
    from public.product_variant_groups pvg
    where pvg.business_id = new.business_id
      and pvg.product_id = new.product_id
      and pvg.variant_group_id = option_variant_group_id
      and pvg.is_enabled = true
  ) then
    raise exception 'Mix-and-match product variant restriction must match a variant group assigned to the product.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_special_mix_match_modifier_group_override_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.special_mix_match_products smmp
    where smmp.id = new.special_mix_match_product_id
      and smmp.business_id = new.business_id
      and smmp.special_id = new.special_id
      and smmp.product_id = new.product_id
  ) then
    raise exception 'Mix-and-match modifier override must match the mix product.';
  end if;

  if not exists (
    select 1
    from public.modifier_groups mg
    where mg.id = new.modifier_group_id
      and mg.business_id = new.business_id
  ) then
    raise exception 'Mix-and-match modifier override must match the modifier group business.';
  end if;

  if not exists (
    select 1
    from public.product_modifier_groups pmg
    where pmg.business_id = new.business_id
      and pmg.product_id = new.product_id
      and pmg.modifier_group_id = new.modifier_group_id
  ) then
    raise exception 'Mix-and-match modifier override group must be assigned to the product.';
  end if;

  return new;
end;
$$;

create index if not exists special_mix_match_rules_business_special_idx
on public.special_mix_match_rules (business_id, special_id);

create index if not exists special_mix_match_products_business_special_idx
on public.special_mix_match_products (business_id, special_id);

create index if not exists special_mix_match_products_business_product_idx
on public.special_mix_match_products (business_id, product_id);

create index if not exists special_mix_match_products_special_sort_idx
on public.special_mix_match_products (special_id, sort_order);

create index if not exists special_mix_match_product_variant_options_business_special_idx
on public.special_mix_match_product_variant_options (business_id, special_id);

create index if not exists special_mix_match_product_variant_options_business_product_idx
on public.special_mix_match_product_variant_options (business_id, product_id);

create index if not exists special_mix_match_product_variant_options_mix_product_idx
on public.special_mix_match_product_variant_options (special_mix_match_product_id);

create index if not exists special_mix_match_modifier_group_overrides_business_special_idx
on public.special_mix_match_modifier_group_overrides (business_id, special_id);

create index if not exists special_mix_match_modifier_group_overrides_business_product_idx
on public.special_mix_match_modifier_group_overrides (business_id, product_id);

create index if not exists special_mix_match_modifier_group_overrides_business_modifier_group_idx
on public.special_mix_match_modifier_group_overrides (business_id, modifier_group_id);

create index if not exists special_mix_match_modifier_group_overrides_mix_product_idx
on public.special_mix_match_modifier_group_overrides (special_mix_match_product_id);

alter table public.special_mix_match_rules enable row level security;
alter table public.special_mix_match_products enable row level security;
alter table public.special_mix_match_product_variant_options enable row level security;
alter table public.special_mix_match_modifier_group_overrides enable row level security;

drop policy if exists "special_mix_match_rules_public_read_enabled"
  on public.special_mix_match_rules;
drop policy if exists "special_mix_match_rules_admin_manage"
  on public.special_mix_match_rules;
drop policy if exists "special_mix_match_products_public_read_enabled"
  on public.special_mix_match_products;
drop policy if exists "special_mix_match_products_admin_manage"
  on public.special_mix_match_products;
drop policy if exists "special_mix_match_product_variant_options_public_read_enabled"
  on public.special_mix_match_product_variant_options;
drop policy if exists "special_mix_match_product_variant_options_admin_manage"
  on public.special_mix_match_product_variant_options;
drop policy if exists "special_mix_match_modifier_group_overrides_public_read_enabled"
  on public.special_mix_match_modifier_group_overrides;
drop policy if exists "special_mix_match_modifier_group_overrides_admin_manage"
  on public.special_mix_match_modifier_group_overrides;

create policy "special_mix_match_rules_public_read_enabled"
on public.special_mix_match_rules
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.specials s
    where s.id = special_mix_match_rules.special_id
      and s.business_id = special_mix_match_rules.business_id
      and s.is_enabled = true
      and s.special_type = 'mix_and_match_fixed_unit_price'
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_mix_match_rules_admin_manage"
on public.special_mix_match_rules
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "special_mix_match_products_public_read_enabled"
on public.special_mix_match_products
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.specials s
    where s.id = special_mix_match_products.special_id
      and s.business_id = special_mix_match_products.business_id
      and s.is_enabled = true
      and s.special_type = 'mix_and_match_fixed_unit_price'
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_mix_match_products_admin_manage"
on public.special_mix_match_products
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "special_mix_match_product_variant_options_public_read_enabled"
on public.special_mix_match_product_variant_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.special_mix_match_products smmp
    join public.specials s
      on s.id = smmp.special_id
      and s.business_id = smmp.business_id
    where smmp.id = special_mix_match_product_variant_options.special_mix_match_product_id
      and smmp.business_id = special_mix_match_product_variant_options.business_id
      and s.is_enabled = true
      and s.special_type = 'mix_and_match_fixed_unit_price'
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_mix_match_product_variant_options_admin_manage"
on public.special_mix_match_product_variant_options
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "special_mix_match_modifier_group_overrides_public_read_enabled"
on public.special_mix_match_modifier_group_overrides
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.special_mix_match_products smmp
    join public.specials s
      on s.id = smmp.special_id
      and s.business_id = smmp.business_id
    where smmp.id = special_mix_match_modifier_group_overrides.special_mix_match_product_id
      and smmp.business_id = special_mix_match_modifier_group_overrides.business_id
      and s.is_enabled = true
      and s.special_type = 'mix_and_match_fixed_unit_price'
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_mix_match_modifier_group_overrides_admin_manage"
on public.special_mix_match_modifier_group_overrides
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists set_special_mix_match_rules_updated_at
  on public.special_mix_match_rules;

create trigger set_special_mix_match_rules_updated_at
before update on public.special_mix_match_rules
for each row execute function public.set_updated_at();

drop trigger if exists set_special_mix_match_modifier_group_overrides_updated_at
  on public.special_mix_match_modifier_group_overrides;

create trigger set_special_mix_match_modifier_group_overrides_updated_at
before update on public.special_mix_match_modifier_group_overrides
for each row execute function public.set_updated_at();

drop trigger if exists validate_special_mix_match_rule_scope
  on public.special_mix_match_rules;

create trigger validate_special_mix_match_rule_scope
before insert or update on public.special_mix_match_rules
for each row execute function public.validate_special_mix_match_rule_scope();

drop trigger if exists validate_special_mix_match_product_scope
  on public.special_mix_match_products;

create trigger validate_special_mix_match_product_scope
before insert or update on public.special_mix_match_products
for each row execute function public.validate_special_mix_match_product_scope();

drop trigger if exists validate_special_mix_match_product_variant_option_scope
  on public.special_mix_match_product_variant_options;

create trigger validate_special_mix_match_product_variant_option_scope
before insert or update on public.special_mix_match_product_variant_options
for each row execute function public.validate_special_mix_match_product_variant_option_scope();

drop trigger if exists validate_special_mix_match_modifier_group_override_scope
  on public.special_mix_match_modifier_group_overrides;

create trigger validate_special_mix_match_modifier_group_override_scope
before insert or update on public.special_mix_match_modifier_group_overrides
for each row execute function public.validate_special_mix_match_modifier_group_override_scope();

commit;
