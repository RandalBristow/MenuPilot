-- 002_rls_policies.sql
-- MenuPilot row level security foundation
--
-- Purpose:
-- - Enable RLS on core tenant-owned tables.
-- - Add helper functions for business/location permissions.
-- - Add baseline public read policies for storefront data.
-- - Add baseline authenticated admin/staff policies.
--
-- Notes:
-- - This is intentionally conservative.
-- - Checkout/order creation will later be handled through server actions/API routes.
-- - Service-role operations bypass RLS and must only run server-side.

-- =========================================================
-- Helper Functions
-- =========================================================

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users bu
    where bu.business_id = target_business_id
      and bu.user_id = auth.uid()
      and bu.is_enabled = true
  )
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users bu
    where bu.business_id = target_business_id
      and bu.user_id = auth.uid()
      and bu.is_enabled = true
      and bu.role = any(allowed_roles)
  )
$$;

create or replace function public.has_location_role(
  target_location_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.location_users lu
    where lu.location_id = target_location_id
      and lu.user_id = auth.uid()
      and lu.is_enabled = true
      and lu.role = any(allowed_roles)
  )
$$;

create or replace function public.can_manage_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_business_role(
    target_business_id,
    array['owner', 'admin']
  )
$$;

create or replace function public.can_manage_business_content(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_business_role(
    target_business_id,
    array['owner', 'admin', 'marketing']
  )
$$;

create or replace function public.can_manage_location(target_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.locations l
      where l.id = target_location_id
        and public.has_business_role(l.business_id, array['owner', 'admin'])
    )
    or public.has_location_role(target_location_id, array['manager'])
$$;

create or replace function public.can_access_location_orders(target_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.locations l
      where l.id = target_location_id
        and public.has_business_role(l.business_id, array['owner', 'admin', 'manager'])
    )
    or public.has_location_role(target_location_id, array['manager', 'staff'])
$$;

-- =========================================================
-- Enable RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_users enable row level security;
alter table public.locations enable row level security;
alter table public.location_users enable row level security;
alter table public.location_hours enable row level security;
alter table public.location_hour_overrides enable row level security;
alter table public.media_assets enable row level security;
alter table public.menus enable row level security;
alter table public.menu_groups enable row level security;
alter table public.products enable row level security;
alter table public.product_groups enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_location_overrides enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifier_options enable row level security;
alter table public.product_modifier_groups enable row level security;
alter table public.product_modifier_option_price_rules enable row level security;
alter table public.product_modifier_option_availability_rules enable row level security;
alter table public.modifier_option_dependency_rules enable row level security;
alter table public.product_included_modifier_groups enable row level security;
alter table public.product_default_modifier_options enable row level security;
alter table public.product_related_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.charges enable row level security;
alter table public.order_charges enable row level security;
alter table public.payments enable row level security;

-- =========================================================
-- Profiles
-- =========================================================

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- =========================================================
-- Businesses
-- =========================================================

create policy "businesses_public_read_active"
on public.businesses
for select
to anon, authenticated
using (status = 'active');

create policy "businesses_member_read"
on public.businesses
for select
to authenticated
using (public.is_business_member(id));

create policy "businesses_owner_admin_update"
on public.businesses
for update
to authenticated
using (public.can_manage_business(id))
with check (public.can_manage_business(id));

-- Early development convenience.
-- Later, business creation can move behind a platform-owner/server flow.
create policy "businesses_authenticated_insert"
on public.businesses
for insert
to authenticated
with check (true);

-- =========================================================
-- Business Users
-- =========================================================

create policy "business_users_member_read"
on public.business_users
for select
to authenticated
using (
  user_id = auth.uid()
  or public.can_manage_business(business_id)
);

create policy "business_users_owner_admin_manage"
on public.business_users
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

-- =========================================================
-- Locations
-- =========================================================

create policy "locations_public_read_enabled"
on public.locations
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.businesses b
    where b.id = locations.business_id
      and b.status = 'active'
  )
);

create policy "locations_member_read"
on public.locations
for select
to authenticated
using (public.is_business_member(business_id));

create policy "locations_owner_admin_manage"
on public.locations
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "locations_manager_update_assigned"
on public.locations
for update
to authenticated
using (public.can_manage_location(id))
with check (public.can_manage_location(id));

-- =========================================================
-- Location Users
-- =========================================================

create policy "location_users_self_or_manager_read"
on public.location_users
for select
to authenticated
using (
  user_id = auth.uid()
  or public.can_manage_location(location_id)
);

create policy "location_users_owner_admin_manage"
on public.location_users
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "location_users_manager_manage_staff"
on public.location_users
for all
to authenticated
using (
  public.has_location_role(location_id, array['manager'])
  and role = 'staff'
)
with check (
  public.has_location_role(location_id, array['manager'])
  and role = 'staff'
);

-- =========================================================
-- Hours
-- =========================================================

create policy "location_hours_public_read"
on public.location_hours
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.locations l
    where l.id = location_hours.location_id
      and l.is_enabled = true
  )
);

create policy "location_hours_manage"
on public.location_hours
for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

create policy "location_hour_overrides_public_read"
on public.location_hour_overrides
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.locations l
    where l.id = location_hour_overrides.location_id
      and l.is_enabled = true
  )
);

create policy "location_hour_overrides_manage"
on public.location_hour_overrides
for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

-- =========================================================
-- Media
-- =========================================================

create policy "media_public_read_not_archived"
on public.media_assets
for select
to anon, authenticated
using (
  is_archived = false
  and exists (
    select 1
    from public.businesses b
    where b.id = media_assets.business_id
      and b.status = 'active'
  )
);

create policy "media_content_managers_manage"
on public.media_assets
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

-- =========================================================
-- Public Menu Read Policies
-- =========================================================

create policy "menus_public_read_enabled"
on public.menus
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.businesses b
    where b.id = menus.business_id
      and b.status = 'active'
  )
);

create policy "menu_groups_public_read_enabled"
on public.menu_groups
for select
to anon, authenticated
using (
  is_enabled = true
  and show_online = true
  and exists (
    select 1
    from public.menus m
    where m.id = menu_groups.menu_id
      and m.is_enabled = true
  )
);

create policy "products_public_read_enabled"
on public.products
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.businesses b
    where b.id = products.business_id
      and b.status = 'active'
  )
);

create policy "product_groups_public_read"
on public.product_groups
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_groups.product_id
      and p.is_enabled = true
  )
);

create policy "product_variants_public_read_enabled"
on public.product_variants
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.is_enabled = true
  )
);

create policy "modifier_groups_public_read_enabled"
on public.modifier_groups
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.businesses b
    where b.id = modifier_groups.business_id
      and b.status = 'active'
  )
);

create policy "modifier_options_public_read_enabled"
on public.modifier_options
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.modifier_groups mg
    where mg.id = modifier_options.modifier_group_id
      and mg.is_enabled = true
  )
);

create policy "product_modifier_groups_public_read_enabled"
on public.product_modifier_groups
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.products p
    where p.id = product_modifier_groups.product_id
      and p.is_enabled = true
  )
);

create policy "price_rules_public_read_enabled"
on public.product_modifier_option_price_rules
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.products p
    where p.id = product_modifier_option_price_rules.product_id
      and p.is_enabled = true
  )
);

create policy "availability_rules_public_read_enabled"
on public.product_modifier_option_availability_rules
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.products p
    where p.id = product_modifier_option_availability_rules.product_id
      and p.is_enabled = true
  )
);

create policy "dependency_rules_public_read_enabled"
on public.modifier_option_dependency_rules
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.products p
    where p.id = modifier_option_dependency_rules.product_id
      and p.is_enabled = true
  )
);

create policy "included_groups_public_read"
on public.product_included_modifier_groups
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_included_modifier_groups.product_id
      and p.is_enabled = true
  )
);

create policy "default_options_public_read"
on public.product_default_modifier_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_default_modifier_options.product_id
      and p.is_enabled = true
  )
);

create policy "related_items_public_read_enabled"
on public.product_related_items
for select
to anon, authenticated
using (
  is_enabled = true
  and exists (
    select 1
    from public.products p
    where p.id = product_related_items.source_product_id
      and p.is_enabled = true
  )
);

create policy "charges_public_read_enabled_visible"
on public.charges
for select
to anon, authenticated
using (
  is_enabled = true
  and show_to_customer = true
  and exists (
    select 1
    from public.businesses b
    where b.id = charges.business_id
      and b.status = 'active'
  )
);

-- =========================================================
-- Admin Menu Management Policies
-- =========================================================

create policy "menus_admin_manage"
on public.menus
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "menu_groups_admin_manage"
on public.menu_groups
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "products_admin_manage"
on public.products
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "product_groups_admin_manage"
on public.product_groups
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "product_variants_admin_manage"
on public.product_variants
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "product_location_overrides_admin_manage"
on public.product_location_overrides
for all
to authenticated
using (
  public.can_manage_business(business_id)
  or public.can_manage_location(location_id)
)
with check (
  public.can_manage_business(business_id)
  or public.can_manage_location(location_id)
);

create policy "modifier_groups_admin_manage"
on public.modifier_groups
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "modifier_options_admin_manage"
on public.modifier_options
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "product_modifier_groups_admin_manage"
on public.product_modifier_groups
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "price_rules_admin_manage"
on public.product_modifier_option_price_rules
for all
to authenticated
using (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_manage_location(location_id)
  )
)
with check (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_manage_location(location_id)
  )
);

create policy "availability_rules_admin_manage"
on public.product_modifier_option_availability_rules
for all
to authenticated
using (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_manage_location(location_id)
  )
)
with check (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_manage_location(location_id)
  )
);

create policy "dependency_rules_admin_manage"
on public.modifier_option_dependency_rules
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "included_groups_admin_manage"
on public.product_included_modifier_groups
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "default_options_admin_manage"
on public.product_default_modifier_options
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "related_items_admin_manage"
on public.product_related_items
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy "charges_admin_manage"
on public.charges
for all
to authenticated
using (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_manage_location(location_id)
  )
)
with check (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_manage_location(location_id)
  )
);

-- =========================================================
-- Orders
-- =========================================================

create policy "orders_staff_admin_read"
on public.orders
for select
to authenticated
using (public.can_access_location_orders(location_id));

create policy "orders_staff_admin_update"
on public.orders
for update
to authenticated
using (public.can_access_location_orders(location_id))
with check (public.can_access_location_orders(location_id));

create policy "orders_staff_admin_insert"
on public.orders
for insert
to authenticated
with check (public.can_access_location_orders(location_id));

create policy "order_items_staff_admin_read"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and public.can_access_location_orders(o.location_id)
  )
);

create policy "order_items_staff_admin_manage"
on public.order_items
for all
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and public.can_access_location_orders(o.location_id)
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and public.can_access_location_orders(o.location_id)
  )
);

create policy "order_item_modifiers_staff_admin_read"
on public.order_item_modifiers
for select
to authenticated
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_modifiers.order_item_id
      and public.can_access_location_orders(o.location_id)
  )
);

create policy "order_item_modifiers_staff_admin_manage"
on public.order_item_modifiers
for all
to authenticated
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_modifiers.order_item_id
      and public.can_access_location_orders(o.location_id)
  )
)
with check (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_modifiers.order_item_id
      and public.can_access_location_orders(o.location_id)
  )
);

create policy "order_charges_staff_admin_read"
on public.order_charges
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_charges.order_id
      and public.can_access_location_orders(o.location_id)
  )
);

create policy "order_charges_staff_admin_manage"
on public.order_charges
for all
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_charges.order_id
      and public.can_access_location_orders(o.location_id)
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_charges.order_id
      and public.can_access_location_orders(o.location_id)
  )
);

-- =========================================================
-- Payments
-- =========================================================

create policy "payments_staff_admin_read"
on public.payments
for select
to authenticated
using (
  public.can_manage_business(business_id)
  or (
    location_id is not null
    and public.can_access_location_orders(location_id)
  )
);

create policy "payments_admin_manage"
on public.payments
for all
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

-- =========================================================
-- Function Grants
-- =========================================================

grant execute on function public.current_user_id() to anon, authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;
grant execute on function public.has_location_role(uuid, text[]) to authenticated;
grant execute on function public.can_manage_business(uuid) to authenticated;
grant execute on function public.can_manage_business_content(uuid) to authenticated;
grant execute on function public.can_manage_location(uuid) to authenticated;
grant execute on function public.can_access_location_orders(uuid) to authenticated;
