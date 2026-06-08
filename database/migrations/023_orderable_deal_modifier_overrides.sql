begin;

create table if not exists public.special_component_modifier_group_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_component_id uuid not null references public.special_components(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  included_selection_count numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_component_modifier_group_overrides_unique
    unique (special_component_id, product_id, modifier_group_id),
  constraint special_component_modifier_group_overrides_count_nonnegative_check
    check (included_selection_count >= 0)
);

create or replace function public.validate_special_component_modifier_group_override_scope()
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
    raise exception 'Deal modifier override must match the component business.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.business_id = new.business_id
  ) then
    raise exception 'Deal modifier override must match the product business.';
  end if;

  if not exists (
    select 1
    from public.modifier_groups mg
    where mg.id = new.modifier_group_id
      and mg.business_id = new.business_id
  ) then
    raise exception 'Deal modifier override must match the modifier group business.';
  end if;

  if not exists (
    select 1
    from public.special_component_products scp
    where scp.business_id = new.business_id
      and scp.special_component_id = new.special_component_id
      and scp.product_id = new.product_id
  ) then
    raise exception 'Deal modifier override product must be allowed for the component.';
  end if;

  if not exists (
    select 1
    from public.product_modifier_groups pmg
    where pmg.business_id = new.business_id
      and pmg.product_id = new.product_id
      and pmg.modifier_group_id = new.modifier_group_id
  ) then
    raise exception 'Deal modifier override group must be assigned to the product.';
  end if;

  return new;
end;
$$;

create index if not exists special_component_modifier_group_overrides_business_component_idx
on public.special_component_modifier_group_overrides (business_id, special_component_id);

create index if not exists special_component_modifier_group_overrides_business_product_idx
on public.special_component_modifier_group_overrides (business_id, product_id);

create index if not exists special_component_modifier_group_overrides_business_modifier_group_idx
on public.special_component_modifier_group_overrides (business_id, modifier_group_id);

alter table public.special_component_modifier_group_overrides enable row level security;

drop policy if exists "special_component_modifier_group_overrides_public_read_enabled"
  on public.special_component_modifier_group_overrides;
drop policy if exists "special_component_modifier_group_overrides_admin_manage"
  on public.special_component_modifier_group_overrides;

create policy "special_component_modifier_group_overrides_public_read_enabled"
on public.special_component_modifier_group_overrides
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.special_components sc
    join public.specials s
      on s.id = sc.special_id
      and s.business_id = sc.business_id
    where sc.id = special_component_modifier_group_overrides.special_component_id
      and sc.business_id = special_component_modifier_group_overrides.business_id
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

create policy "special_component_modifier_group_overrides_admin_manage"
on public.special_component_modifier_group_overrides
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists set_special_component_modifier_group_overrides_updated_at
  on public.special_component_modifier_group_overrides;

create trigger set_special_component_modifier_group_overrides_updated_at
before update on public.special_component_modifier_group_overrides
for each row execute function public.set_updated_at();

drop trigger if exists validate_special_component_modifier_group_override_scope
  on public.special_component_modifier_group_overrides;

create trigger validate_special_component_modifier_group_override_scope
before insert or update on public.special_component_modifier_group_overrides
for each row execute function public.validate_special_component_modifier_group_override_scope();

commit;
