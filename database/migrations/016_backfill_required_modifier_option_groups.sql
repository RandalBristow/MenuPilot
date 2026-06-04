begin;

-- Product builders and admin modifier management expect every Modifier Option
-- to belong to a Modifier Option Group/List. Earlier seed data created several
-- options directly under their Modifier Group. Backfill explicit lists for
-- those seeded groups and attach the existing options.

with target_groups as (
  select
    mg.id as modifier_group_id,
    mg.business_id,
    mg.name as modifier_group_name,
    list.name as option_group_name,
    list.description,
    list.sort_order
  from public.modifier_groups mg
  join (
    values
      ('Crust Type', 'Crust Types', 'Crust type choices', 1),
      ('Crust Style', 'Crust Styles', 'Crust style choices', 1),
      ('Pizza Sauce', 'Pizza Sauces', 'Pizza sauce choices', 1),
      ('Wing Sauce', 'Wing Sauces', 'Wing sauce choices', 1),
      ('Sub Bread', 'Breads', 'Bread choices', 1),
      ('Sub Extras', 'Extras', 'Extra add-ons', 1),
      ('Salad Dressing', 'Dressings', 'Dressing choices', 1),
      ('Salad Protein', 'Proteins', 'Protein add-ons', 1),
      ('Coffee Milk', 'Milks', 'Milk choices', 1),
      ('Flavor Shots', 'Flavor Shots', 'Flavor shot choices', 1)
  ) as list(modifier_group_name, name, description, sort_order)
    on list.modifier_group_name = mg.name
)
insert into public.modifier_option_groups (
  business_id,
  modifier_group_id,
  name,
  description,
  sort_order,
  is_enabled
)
select
  target_groups.business_id,
  target_groups.modifier_group_id,
  target_groups.option_group_name,
  target_groups.description,
  target_groups.sort_order,
  true
from target_groups
where not exists (
  select 1
  from public.modifier_option_groups existing
  where existing.modifier_group_id = target_groups.modifier_group_id
    and existing.name = target_groups.option_group_name
);

with target_groups as (
  select
    mg.id as modifier_group_id,
    mg.name as modifier_group_name,
    list.name as option_group_name
  from public.modifier_groups mg
  join (
    values
      ('Crust Type', 'Crust Types'),
      ('Crust Style', 'Crust Styles'),
      ('Wing Sauce', 'Wing Sauces'),
      ('Sub Bread', 'Breads'),
      ('Sub Extras', 'Extras'),
      ('Salad Dressing', 'Dressings'),
      ('Salad Protein', 'Proteins'),
      ('Coffee Milk', 'Milks'),
      ('Flavor Shots', 'Flavor Shots')
  ) as list(modifier_group_name, name)
    on list.modifier_group_name = mg.name
)
update public.modifier_options mo
set modifier_option_group_id = mog.id
from target_groups tg
join public.modifier_option_groups mog
  on mog.modifier_group_id = tg.modifier_group_id
  and mog.name = tg.option_group_name
where mo.modifier_group_id = tg.modifier_group_id
  and mo.modifier_option_group_id is null;

-- Remove placeholder pizza sauce seed options. The correct Pizza Sauces list is
-- created above so real sauce options can be added there through admin.
delete from public.modifier_options mo
using public.modifier_groups mg
where mo.modifier_group_id = mg.id
  and mg.name = 'Pizza Sauce'
  and mo.name in ('Classic Red Sauce', 'Garlic Butter', 'BBQ Sauce');

commit;
