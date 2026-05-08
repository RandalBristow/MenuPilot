-- 005_seed_modifier_option_groups.sql
-- Seed modifier option subgroups for Pizza Toppings

begin;

-- =========================================================
-- Get business + modifier group
-- =========================================================

with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
toppings_group as (
  select mg.*
  from public.modifier_groups mg
  join b on b.business_id = mg.business_id
  where mg.name = 'Pizza Toppings'
)

-- =========================================================
-- Insert option groups
-- =========================================================

insert into public.modifier_option_groups (
  business_id,
  modifier_group_id,
  name,
  description,
  sort_order,
  is_enabled
)
select
  tg.business_id,
  tg.id,
  x.name,
  x.description,
  x.sort_order,
  true
from toppings_group tg
cross join (
  values
    ('Meats', 'All meat toppings', 1),
    ('Veggies', 'Vegetable toppings', 2),
    ('Cheeses', 'Cheese toppings', 3)
) as x(name, description, sort_order)
where not exists (
  select 1
  from public.modifier_option_groups mog
  where mog.modifier_group_id = tg.id
    and mog.name = x.name
);

-- =========================================================
-- Assign existing modifier options to groups
-- =========================================================

with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
toppings_group as (
  select mg.*
  from public.modifier_groups mg
  join b on b.business_id = mg.business_id
  where mg.name = 'Pizza Toppings'
),
groups as (
  select mog.*
  from public.modifier_option_groups mog
  join toppings_group tg on tg.id = mog.modifier_group_id
),
options as (
  select mo.*
  from public.modifier_options mo
  join toppings_group tg on tg.id = mo.modifier_group_id
)

update public.modifier_options mo
set modifier_option_group_id = g.id
from groups g
where mo.id in (
  select o.id
  from options o
  where
    (o.name in ('Pepperoni', 'Sausage', 'Ham', 'Bacon') and g.name = 'Meats')
    or
    (o.name in ('Mushrooms', 'Onions', 'Green Peppers') and g.name = 'Veggies')
    or
    (o.name in ('Extra Cheese') and g.name = 'Cheeses')
);

commit;