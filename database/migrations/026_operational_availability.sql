begin;

create table if not exists public.product_operational_availability (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  is_86d boolean not null default false,
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modifier_option_operational_availability (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  is_86d boolean not null default false,
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_operational_availability_business_unique
on public.product_operational_availability (business_id, product_id)
where location_id is null;

create unique index if not exists product_operational_availability_location_unique
on public.product_operational_availability (business_id, location_id, product_id)
where location_id is not null;

create unique index if not exists modifier_option_operational_availability_business_unique
on public.modifier_option_operational_availability (business_id, modifier_option_id)
where location_id is null;

create unique index if not exists modifier_option_operational_availability_location_unique
on public.modifier_option_operational_availability (business_id, location_id, modifier_option_id)
where location_id is not null;

create index if not exists product_operational_availability_lookup_idx
on public.product_operational_availability (business_id, location_id, product_id, is_86d, expires_at);

create index if not exists modifier_option_operational_availability_lookup_idx
on public.modifier_option_operational_availability (business_id, location_id, modifier_option_id, is_86d, expires_at);

create or replace function public.validate_product_operational_availability_scope()
returns trigger
language plpgsql
as $$
begin
  if new.location_id is not null
    and not exists (
      select 1
      from public.locations l
      where l.id = new.location_id
        and l.business_id = new.business_id
    )
  then
    raise exception 'Product operational availability location must match the business.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.business_id = new.business_id
  ) then
    raise exception 'Product operational availability must match the product business.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_modifier_option_operational_availability_scope()
returns trigger
language plpgsql
as $$
begin
  if new.location_id is not null
    and not exists (
      select 1
      from public.locations l
      where l.id = new.location_id
        and l.business_id = new.business_id
    )
  then
    raise exception 'Modifier option operational availability location must match the business.';
  end if;

  if not exists (
    select 1
    from public.modifier_options mo
    where mo.id = new.modifier_option_id
      and mo.business_id = new.business_id
  ) then
    raise exception 'Modifier option operational availability must match the option business.';
  end if;

  return new;
end;
$$;

alter table public.product_operational_availability enable row level security;
alter table public.modifier_option_operational_availability enable row level security;

drop policy if exists "product_operational_availability_public_read"
  on public.product_operational_availability;
drop policy if exists "product_operational_availability_admin_manage"
  on public.product_operational_availability;
drop policy if exists "modifier_option_operational_availability_public_read"
  on public.modifier_option_operational_availability;
drop policy if exists "modifier_option_operational_availability_admin_manage"
  on public.modifier_option_operational_availability;

create policy "product_operational_availability_public_read"
on public.product_operational_availability
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = product_operational_availability.business_id
      and b.status = 'active'
  )
);

create policy "product_operational_availability_admin_manage"
on public.product_operational_availability
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

create policy "modifier_option_operational_availability_public_read"
on public.modifier_option_operational_availability
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = modifier_option_operational_availability.business_id
      and b.status = 'active'
  )
);

create policy "modifier_option_operational_availability_admin_manage"
on public.modifier_option_operational_availability
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists set_product_operational_availability_updated_at
  on public.product_operational_availability;

create trigger set_product_operational_availability_updated_at
before update on public.product_operational_availability
for each row execute function public.set_updated_at();

drop trigger if exists set_modifier_option_operational_availability_updated_at
  on public.modifier_option_operational_availability;

create trigger set_modifier_option_operational_availability_updated_at
before update on public.modifier_option_operational_availability
for each row execute function public.set_updated_at();

drop trigger if exists validate_product_operational_availability_scope
  on public.product_operational_availability;

create trigger validate_product_operational_availability_scope
before insert or update on public.product_operational_availability
for each row execute function public.validate_product_operational_availability_scope();

drop trigger if exists validate_modifier_option_operational_availability_scope
  on public.modifier_option_operational_availability;

create trigger validate_modifier_option_operational_availability_scope
before insert or update on public.modifier_option_operational_availability
for each row execute function public.validate_modifier_option_operational_availability_scope();

commit;
