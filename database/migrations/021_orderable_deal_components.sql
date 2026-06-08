begin;

alter table public.specials
drop constraint if exists specials_special_type_check;

alter table public.specials
add constraint specials_special_type_check
  check (special_type in (
    'line_discount',
    'fixed_price_line',
    'cart_discount',
    'orderable_deal'
  ));

create table if not exists public.special_components (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  label text not null,
  description text,
  sort_order integer not null default 0,
  required_quantity integer not null default 1,
  min_quantity integer not null default 1,
  max_quantity integer not null default 1,
  pricing_behavior text not null default 'included_base',
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_components_label_nonempty_check
    check (length(btrim(label)) > 0),
  constraint special_components_pricing_behavior_check
    check (pricing_behavior in ('included_base')),
  constraint special_components_quantity_nonnegative_check
    check (
      required_quantity >= 0
      and min_quantity >= 0
      and max_quantity >= 0
    ),
  constraint special_components_quantity_range_check
    check (
      min_quantity <= max_quantity
      and required_quantity >= min_quantity
      and required_quantity <= max_quantity
    )
);

create table if not exists public.special_component_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_component_id uuid not null references public.special_components(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint special_component_products_unique
    unique (special_component_id, product_id)
);

create or replace function public.validate_special_component_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.specials s
    where s.id = new.special_id
      and s.business_id = new.business_id
      and s.special_type = 'orderable_deal'
  ) then
    raise exception 'Special component must match an orderable deal in the same business.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_special_component_product_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.special_components sc
    where sc.id = new.special_component_id
      and sc.business_id = new.business_id
  ) then
    raise exception 'Special component product must match the component business.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.business_id = new.business_id
  ) then
    raise exception 'Special component product must match the product business.';
  end if;

  return new;
end;
$$;

create index if not exists special_components_business_special_idx
on public.special_components (business_id, special_id);

create index if not exists special_components_special_sort_idx
on public.special_components (special_id, sort_order);

create index if not exists special_component_products_business_component_idx
on public.special_component_products (business_id, special_component_id);

create index if not exists special_component_products_business_product_idx
on public.special_component_products (business_id, product_id);

alter table public.special_components enable row level security;
alter table public.special_component_products enable row level security;

drop policy if exists "special_components_public_read_enabled"
  on public.special_components;
drop policy if exists "special_components_admin_manage"
  on public.special_components;
drop policy if exists "special_component_products_public_read_enabled"
  on public.special_component_products;
drop policy if exists "special_component_products_admin_manage"
  on public.special_component_products;

create policy "special_components_public_read_enabled"
on public.special_components
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.specials s
    where s.id = special_components.special_id
      and s.is_enabled = true
      and s.special_type = 'orderable_deal'
      and s.business_id = special_components.business_id
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_components_admin_manage"
on public.special_components
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "special_component_products_public_read_enabled"
on public.special_component_products
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.special_components sc
    join public.specials s
      on s.id = sc.special_id
      and s.business_id = sc.business_id
    where sc.id = special_component_products.special_component_id
      and sc.business_id = special_component_products.business_id
      and s.is_enabled = true
      and s.special_type = 'orderable_deal'
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_component_products_admin_manage"
on public.special_component_products
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists set_special_components_updated_at
  on public.special_components;

create trigger set_special_components_updated_at
before update on public.special_components
for each row execute function public.set_updated_at();

drop trigger if exists validate_special_component_scope
  on public.special_components;

create trigger validate_special_component_scope
before insert or update on public.special_components
for each row execute function public.validate_special_component_scope();

drop trigger if exists validate_special_component_product_scope
  on public.special_component_products;

create trigger validate_special_component_product_scope
before insert or update on public.special_component_products
for each row execute function public.validate_special_component_product_scope();

commit;
