begin;

create table if not exists public.specials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  customer_description text,
  special_type text not null,
  discount_type text not null,
  discount_value numeric(10,2) not null default 0,
  min_order_amount numeric(10,2),
  starts_at timestamptz,
  ends_at timestamptz,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint specials_special_type_check
    check (special_type in ('line_discount', 'fixed_price_line', 'cart_discount')),
  constraint specials_discount_type_check
    check (discount_type in ('percentage', 'fixed_amount', 'fixed_price')),
  constraint specials_discount_value_nonnegative_check
    check (discount_value >= 0),
  constraint specials_min_order_amount_nonnegative_check
    check (min_order_amount is null or min_order_amount >= 0),
  constraint specials_schedule_check
    check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create table if not exists public.special_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_option_id uuid references public.variant_group_options(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.special_menu_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  menu_group_id uuid not null references public.menu_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint special_menu_groups_unique
    unique (special_id, menu_group_id)
);

create table if not exists public.order_discounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  special_id uuid references public.specials(id) on delete set null,
  name_snapshot text not null,
  special_type_snapshot text not null,
  discount_type_snapshot text not null,
  discount_value_snapshot numeric(10,2) not null default 0,
  amount numeric(10,2) not null,
  coupon_code_snapshot text,
  created_at timestamptz not null default now(),
  constraint order_discounts_special_type_snapshot_check
    check (special_type_snapshot in ('line_discount', 'fixed_price_line', 'cart_discount')),
  constraint order_discounts_discount_type_snapshot_check
    check (discount_type_snapshot in ('percentage', 'fixed_amount', 'fixed_price')),
  constraint order_discounts_discount_value_snapshot_nonnegative_check
    check (discount_value_snapshot >= 0),
  constraint order_discounts_amount_nonnegative_check
    check (amount >= 0)
);

create or replace function public.validate_special_product_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.specials s
    where s.id = new.special_id
      and s.business_id = new.business_id
  ) then
    raise exception 'Special product eligibility must match the special business.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.business_id = new.business_id
  ) then
    raise exception 'Special product eligibility must match the product business.';
  end if;

  if new.variant_group_option_id is not null
    and not exists (
      select 1
      from public.variant_group_options vgo
      where vgo.id = new.variant_group_option_id
        and vgo.business_id = new.business_id
    )
  then
    raise exception 'Special product variant eligibility must match the variant option business.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_special_menu_group_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.specials s
    where s.id = new.special_id
      and s.business_id = new.business_id
  ) then
    raise exception 'Special menu group eligibility must match the special business.';
  end if;

  if not exists (
    select 1
    from public.menu_groups mg
    where mg.id = new.menu_group_id
      and mg.business_id = new.business_id
  ) then
    raise exception 'Special menu group eligibility must match the menu group business.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_order_discount_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.orders o
    where o.id = new.order_id
      and o.business_id = new.business_id
  ) then
    raise exception 'Order discount must match the order business.';
  end if;

  if new.order_item_id is not null
    and not exists (
      select 1
      from public.order_items oi
      where oi.id = new.order_item_id
        and oi.order_id = new.order_id
        and oi.business_id = new.business_id
    )
  then
    raise exception 'Order item discount must match the order and business.';
  end if;

  if new.special_id is not null
    and not exists (
      select 1
      from public.specials s
      where s.id = new.special_id
        and s.business_id = new.business_id
    )
  then
    raise exception 'Order discount special must match the order business.';
  end if;

  return new;
end;
$$;

create unique index if not exists special_products_product_unique
on public.special_products (special_id, product_id)
where variant_group_option_id is null;

create unique index if not exists special_products_product_variant_unique
on public.special_products (special_id, product_id, variant_group_option_id)
where variant_group_option_id is not null;

create index if not exists specials_business_id_idx
on public.specials (business_id);

create index if not exists specials_business_enabled_idx
on public.specials (business_id, is_enabled);

create index if not exists specials_business_schedule_idx
on public.specials (business_id, starts_at, ends_at);

create index if not exists special_products_business_special_idx
on public.special_products (business_id, special_id);

create index if not exists special_products_business_product_idx
on public.special_products (business_id, product_id);

create index if not exists special_menu_groups_business_special_idx
on public.special_menu_groups (business_id, special_id);

create index if not exists special_menu_groups_business_menu_group_idx
on public.special_menu_groups (business_id, menu_group_id);

create index if not exists order_discounts_business_order_idx
on public.order_discounts (business_id, order_id);

create index if not exists order_discounts_order_item_idx
on public.order_discounts (order_item_id);

alter table public.specials enable row level security;
alter table public.special_products enable row level security;
alter table public.special_menu_groups enable row level security;
alter table public.order_discounts enable row level security;

drop policy if exists "specials_public_read_enabled"
  on public.specials;
drop policy if exists "specials_admin_manage"
  on public.specials;
drop policy if exists "special_products_public_read_enabled"
  on public.special_products;
drop policy if exists "special_products_admin_manage"
  on public.special_products;
drop policy if exists "special_menu_groups_public_read_enabled"
  on public.special_menu_groups;
drop policy if exists "special_menu_groups_admin_manage"
  on public.special_menu_groups;
drop policy if exists "order_discounts_staff_admin_read"
  on public.order_discounts;
drop policy if exists "order_discounts_staff_admin_manage"
  on public.order_discounts;

create policy "specials_public_read_enabled"
on public.specials
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.businesses b
    where b.id = specials.business_id
      and b.status = 'active'
  )
);

create policy "specials_admin_manage"
on public.specials
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "special_products_public_read_enabled"
on public.special_products
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.specials s
    where s.id = special_products.special_id
      and s.is_enabled = true
      and s.business_id = special_products.business_id
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_products_admin_manage"
on public.special_products
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "special_menu_groups_public_read_enabled"
on public.special_menu_groups
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.specials s
    where s.id = special_menu_groups.special_id
      and s.is_enabled = true
      and s.business_id = special_menu_groups.business_id
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_menu_groups_admin_manage"
on public.special_menu_groups
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "order_discounts_staff_admin_read"
on public.order_discounts
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_discounts.order_id
      and public.can_access_location_orders(o.location_id)
  )
);

create policy "order_discounts_staff_admin_manage"
on public.order_discounts
for all
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_discounts.order_id
      and public.can_access_location_orders(o.location_id)
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_discounts.order_id
      and public.can_access_location_orders(o.location_id)
  )
);

drop trigger if exists set_specials_updated_at
  on public.specials;

create trigger set_specials_updated_at
before update on public.specials
for each row execute function public.set_updated_at();

drop trigger if exists validate_special_product_scope
  on public.special_products;

create trigger validate_special_product_scope
before insert or update on public.special_products
for each row execute function public.validate_special_product_scope();

drop trigger if exists validate_special_menu_group_scope
  on public.special_menu_groups;

create trigger validate_special_menu_group_scope
before insert or update on public.special_menu_groups
for each row execute function public.validate_special_menu_group_scope();

drop trigger if exists validate_order_discount_scope
  on public.order_discounts;

create trigger validate_order_discount_scope
before insert or update on public.order_discounts
for each row execute function public.validate_order_discount_scope();

commit;
