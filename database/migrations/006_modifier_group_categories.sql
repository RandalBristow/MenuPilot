begin;

create table if not exists public.modifier_group_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

alter table public.modifier_groups
add column if not exists modifier_group_category_id uuid
references public.modifier_group_categories(id) on delete set null;

create index if not exists idx_modifier_group_categories_business_id
on public.modifier_group_categories(business_id);

create index if not exists idx_modifier_groups_category_id
on public.modifier_groups(modifier_group_category_id);

-- Seed categories for pronto-demo
with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
)
insert into public.modifier_group_categories (
  business_id,
  name,
  description,
  sort_order,
  is_enabled
)
select
  b.business_id,
  x.name,
  x.description,
  x.sort_order,
  true
from b
cross join (
  values
    ('Pizza modifiers', 'Modifier groups used for pizza products.', 1),
    ('Wing modifiers', 'Modifier groups used for wing products.', 2),
    ('Sub modifiers', 'Modifier groups used for sub products.', 3),
    ('Salad modifiers', 'Modifier groups used for salad products.', 4),
    ('Drink modifiers', 'Modifier groups used for drink products.', 5),
    ('General modifiers', 'Shared or uncategorized modifier groups.', 99)
) as x(name, description, sort_order)
on conflict (business_id, name) do nothing;

-- Assign existing modifier groups
with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
cats as (
  select mgc.*
  from public.modifier_group_categories mgc
  join b on b.business_id = mgc.business_id
)
update public.modifier_groups mg
set modifier_group_category_id = cats.id
from cats
where mg.business_id = cats.business_id
  and (
    (
      cats.name = 'Pizza modifiers'
      and mg.name in (
        'Crust Type',
        'Crust Style',
        'Pizza Sauce',
        'Pizza Toppings'
      )
    )
    or (
      cats.name = 'Wing modifiers'
      and mg.name in (
        'Wing Sauce',
        'Wing Dipping Sauce',
        'Wing Extras'
      )
    )
    or (
      cats.name = 'Sub modifiers'
      and mg.name in (
        'Sub Extras',
        'Sub Cheese',
        'Sub Toppings'
      )
    )
    or (
      cats.name = 'Salad modifiers'
      and mg.name in (
        'Salad Dressing',
        'Salad Protein',
        'Salad Toppings'
      )
    )
    or (
      cats.name = 'Drink modifiers'
      and mg.name in (
        'Coffee Milk',
        'Coffee Flavor',
        'Drink Size'
      )
    )
  );

-- Any remaining groups go to General modifiers
with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
general_cat as (
  select mgc.id, mgc.business_id
  from public.modifier_group_categories mgc
  join b on b.business_id = mgc.business_id
  where mgc.name = 'General modifiers'
)
update public.modifier_groups mg
set modifier_group_category_id = general_cat.id
from general_cat
where mg.business_id = general_cat.business_id
  and mg.modifier_group_category_id is null;

commit;