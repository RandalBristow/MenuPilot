begin;

create table if not exists public.special_component_product_variant_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_component_product_id uuid not null references public.special_component_products(id) on delete cascade,
  special_component_id uuid not null references public.special_components(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_group_option_id uuid not null references public.variant_group_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint special_component_product_variant_options_unique
    unique (special_component_product_id, variant_group_option_id)
);

create or replace function public.validate_special_component_product_variant_option_scope()
returns trigger
language plpgsql
as $$
declare
  option_variant_group_id uuid;
begin
  if not exists (
    select 1
    from public.special_component_products scp
    where scp.id = new.special_component_product_id
      and scp.business_id = new.business_id
      and scp.special_component_id = new.special_component_id
      and scp.product_id = new.product_id
  ) then
    raise exception 'Special component product variant restriction must match the component product.';
  end if;

  select vgo.variant_group_id
  into option_variant_group_id
  from public.variant_group_options vgo
  where vgo.id = new.variant_group_option_id
    and vgo.business_id = new.business_id;

  if option_variant_group_id is null then
    raise exception 'Special component product variant restriction must match the business.';
  end if;

  if not exists (
    select 1
    from public.product_variant_groups pvg
    where pvg.business_id = new.business_id
      and pvg.product_id = new.product_id
      and pvg.variant_group_id = option_variant_group_id
      and pvg.is_enabled = true
  ) then
    raise exception 'Special component product variant restriction must match a variant group assigned to the product.';
  end if;

  return new;
end;
$$;

create index if not exists special_component_product_variant_options_business_component_idx
on public.special_component_product_variant_options (business_id, special_component_id);

create index if not exists special_component_product_variant_options_business_product_idx
on public.special_component_product_variant_options (business_id, product_id);

create index if not exists special_component_product_variant_options_component_product_idx
on public.special_component_product_variant_options (special_component_product_id);

alter table public.special_component_product_variant_options enable row level security;

drop policy if exists "special_component_product_variant_options_public_read_enabled"
  on public.special_component_product_variant_options;
drop policy if exists "special_component_product_variant_options_admin_manage"
  on public.special_component_product_variant_options;

create policy "special_component_product_variant_options_public_read_enabled"
on public.special_component_product_variant_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.special_component_products scp
    join public.special_components sc
      on sc.id = scp.special_component_id
      and sc.business_id = scp.business_id
    join public.specials s
      on s.id = sc.special_id
      and s.business_id = sc.business_id
    where scp.id = special_component_product_variant_options.special_component_product_id
      and scp.business_id = special_component_product_variant_options.business_id
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

create policy "special_component_product_variant_options_admin_manage"
on public.special_component_product_variant_options
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists validate_special_component_product_variant_option_scope
  on public.special_component_product_variant_options;

create trigger validate_special_component_product_variant_option_scope
before insert or update on public.special_component_product_variant_options
for each row execute function public.validate_special_component_product_variant_option_scope();

commit;
