-- 030_unified_employee_permissions.sql
-- Consolidate manager and staff settings into one per-location employee model.

create table public.employee_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  can_view_orders boolean not null default true,
  can_update_order_status boolean not null default true,
  can_view_customer_contact boolean not null default true,
  can_manage_product_availability boolean not null default false,
  can_manage_modifier_availability boolean not null default false,
  can_manage_location_ordering boolean not null default false,
  can_edit_products boolean not null default false,
  can_edit_modifiers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, user_id)
);

create index idx_employee_permissions_business_id
  on public.employee_permissions(business_id);

create trigger set_employee_permissions_updated_at
before update on public.employee_permissions
for each row execute function public.set_updated_at();

do $$
begin
  if to_regclass('public.manager_permissions') is not null then
    execute $migration$
      insert into public.employee_permissions (
        business_id, location_id, user_id,
        can_view_orders, can_update_order_status, can_view_customer_contact,
        can_manage_product_availability, can_manage_modifier_availability,
        can_manage_location_ordering, can_edit_products, can_edit_modifiers
      )
      select
        business_id, location_id, user_id,
        can_manage_orders, can_manage_orders, true,
        can_manage_product_availability, can_manage_modifier_availability,
        can_manage_location_ordering, can_edit_products, can_edit_modifiers
      from public.manager_permissions
      on conflict (location_id, user_id) do update set
        can_view_orders = excluded.can_view_orders,
        can_update_order_status = excluded.can_update_order_status,
        can_view_customer_contact = excluded.can_view_customer_contact,
        can_manage_product_availability = excluded.can_manage_product_availability,
        can_manage_modifier_availability = excluded.can_manage_modifier_availability,
        can_manage_location_ordering = excluded.can_manage_location_ordering,
        can_edit_products = excluded.can_edit_products,
        can_edit_modifiers = excluded.can_edit_modifiers
    $migration$;
  end if;

  if to_regclass('public.staff_permissions') is not null then
    execute $migration$
      insert into public.employee_permissions (
        business_id, location_id, user_id,
        can_view_orders, can_update_order_status, can_view_customer_contact,
        can_manage_product_availability, can_manage_modifier_availability
      )
      select
        business_id, location_id, user_id,
        can_view_orders, can_update_order_status, can_view_customer_contact,
        can_manage_product_availability, can_manage_modifier_availability
      from public.staff_permissions
      on conflict (location_id, user_id) do update set
        can_view_orders = excluded.can_view_orders,
        can_update_order_status = excluded.can_update_order_status,
        can_view_customer_contact = excluded.can_view_customer_contact,
        can_manage_product_availability = excluded.can_manage_product_availability,
        can_manage_modifier_availability = excluded.can_manage_modifier_availability
    $migration$;
  end if;
end $$;

drop table if exists public.manager_permissions cascade;
drop table if exists public.staff_permissions cascade;

alter table public.employee_permissions enable row level security;

create policy "employee_permissions_business_admin_read"
on public.employee_permissions for select
to authenticated
using (
  public.has_business_role(business_id, array['owner', 'admin'])
  or public.has_location_role(location_id, array['manager', 'staff'])
);

create policy "employee_permissions_business_admin_manage"
on public.employee_permissions for all
to authenticated
using (public.has_business_role(business_id, array['owner', 'admin']))
with check (public.has_business_role(business_id, array['owner', 'admin']));
