-- 028_manager_permissions.sql
-- Per-location permissions for manager assignments.

create table public.manager_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  can_manage_orders boolean not null default true,
  can_manage_product_availability boolean not null default true,
  can_manage_modifier_availability boolean not null default true,
  can_manage_location_ordering boolean not null default false,
  can_edit_products boolean not null default false,
  can_edit_modifiers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, user_id)
);

create index idx_manager_permissions_business_id
  on public.manager_permissions(business_id);

create trigger set_manager_permissions_updated_at
before update on public.manager_permissions
for each row execute function public.set_updated_at();

alter table public.manager_permissions enable row level security;

create policy "manager_permissions_owner_admin_read"
on public.manager_permissions for select
to authenticated
using (
  public.has_business_role(business_id, array['owner', 'admin'])
  or public.has_location_role(location_id, array['manager'])
);

create policy "manager_permissions_owner_admin_manage"
on public.manager_permissions for all
to authenticated
using (public.has_business_role(business_id, array['owner', 'admin']))
with check (public.has_business_role(business_id, array['owner', 'admin']));
