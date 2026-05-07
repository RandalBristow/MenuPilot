-- 003_seed_data.sql
-- MenuPilot development seed data
--
-- Purpose:
-- - Seed one realistic demo business/location.
-- - Create nested menu groups.
-- - Create products, variants, modifiers, pricing rules, availability rules,
--   included/default toppings, related add-ons, hours, and charges.
--
-- Safe to run after:
-- - 001_initial_schema.sql
-- - 002_rls_policies.sql
--
-- Notes:
-- - This seed is for development only.
-- - It uses deterministic slugs/names but generated UUIDs via CTE inserts.
-- - It avoids auth.users/profiles because auth users should be created through Supabase Auth.

begin;

-- =========================================================
-- Demo Business
-- =========================================================

insert into public.businesses (
  name,
  slug,
  legal_name,
  description,
  status
)
values (
  'Pronto Demo Pizza & Carryout',
  'pronto-demo',
  'Pronto Demo Pizza & Carryout LLC',
  'A demo pizza, wings, subs, salads, drinks, and coffee carryout used for MenuPilot development.',
  'active'
)
on conflict (slug) do update
set
  name = excluded.name,
  legal_name = excluded.legal_name,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

-- =========================================================
-- Demo Location
-- =========================================================

insert into public.locations (
  business_id,
  name,
  slug,
  address_line1,
  city,
  state,
  postal_code,
  country,
  phone,
  email,
  timezone,
  google_maps_url,
  google_review_url,
  is_enabled,
  accepting_orders,
  pickup_enabled,
  delivery_enabled,
  default_prep_time_minutes,
  rush_prep_time_minutes,
  sort_order
)
select
  b.id,
  'Main Street',
  'main-street',
  '123 Main Street',
  'Mansfield',
  'OH',
  '44902',
  'US',
  '555-555-1212',
  'orders@prontodemo.com',
  'America/New_York',
  'https://maps.google.com',
  'https://search.google.com/local/writereview',
  true,
  true,
  true,
  true,
  20,
  35,
  1
from public.businesses b
where b.slug = 'pronto-demo'
on conflict (business_id, slug) do update
set
  name = excluded.name,
  address_line1 = excluded.address_line1,
  city = excluded.city,
  state = excluded.state,
  postal_code = excluded.postal_code,
  phone = excluded.phone,
  email = excluded.email,
  timezone = excluded.timezone,
  google_maps_url = excluded.google_maps_url,
  google_review_url = excluded.google_review_url,
  is_enabled = excluded.is_enabled,
  accepting_orders = excluded.accepting_orders,
  pickup_enabled = excluded.pickup_enabled,
  delivery_enabled = excluded.delivery_enabled,
  default_prep_time_minutes = excluded.default_prep_time_minutes,
  rush_prep_time_minutes = excluded.rush_prep_time_minutes,
  sort_order = excluded.sort_order,
  updated_at = now();

-- =========================================================
-- Hours
-- =========================================================

with loc as (
  select l.*
  from public.locations l
  join public.businesses b on b.id = l.business_id
  where b.slug = 'pronto-demo'
    and l.slug = 'main-street'
)
insert into public.location_hours (
  business_id,
  location_id,
  day_of_week,
  opens_at,
  closes_at,
  is_closed
)
select
  loc.business_id,
  loc.id,
  x.day_of_week,
  x.opens_at::time,
  x.closes_at::time,
  x.is_closed
from loc
cross join (
  values
    (0, '12:00', '21:00', false),
    (1, '11:00', '21:00', false),
    (2, '11:00', '21:00', false),
    (3, '11:00', '21:00', false),
    (4, '11:00', '22:00', false),
    (5, '11:00', '23:00', false),
    (6, '11:00', '23:00', false)
) as x(day_of_week, opens_at, closes_at, is_closed)
on conflict (location_id, day_of_week) do update
set
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  is_closed = excluded.is_closed,
  updated_at = now();

-- =========================================================
-- Menu
-- =========================================================

insert into public.menus (
  business_id,
  location_id,
  name,
  description,
  menu_type,
  is_enabled,
  sort_order
)
select
  b.id,
  null,
  'Main Menu',
  'Primary online ordering menu.',
  'online',
  true,
  1
from public.businesses b
where b.slug = 'pronto-demo';

-- =========================================================
-- Menu Groups
-- =========================================================

with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
m as (
  select menus.id as menu_id, menus.business_id
  from public.menus menus
  join b on b.business_id = menus.business_id
  where menus.name = 'Main Menu'
)
insert into public.menu_groups (
  business_id,
  menu_id,
  parent_group_id,
  name,
  slug,
  description,
  display_style,
  is_enabled,
  show_online,
  show_on_print_menu,
  show_on_display_panels,
  sort_order
)
select
  m.business_id,
  m.menu_id,
  null,
  x.name,
  x.slug,
  x.description,
  x.display_style,
  true,
  true,
  true,
  true,
  x.sort_order
from m
cross join (
  values
    ('Pizza', 'pizza', 'Build your own or choose a specialty pizza.', 'grid', 1),
    ('Wings', 'wings', 'Traditional and boneless wings.', 'grid', 2),
    ('Subs', 'subs', 'Hot and cold subs.', 'grid', 3),
    ('Salads', 'salads', 'Fresh salads and add-ons.', 'grid', 4),
    ('Drinks', 'drinks', 'Soda, coffee, and more.', 'list', 5),
    ('Sides', 'sides', 'Breadsticks, sauces, and snacks.', 'grid', 6)
) as x(name, slug, description, display_style, sort_order);

with groups as (
  select mg.*, m.name as menu_name
  from public.menu_groups mg
  join public.menus m on m.id = mg.menu_id
  join public.businesses b on b.id = mg.business_id
  where b.slug = 'pronto-demo'
    and m.name = 'Main Menu'
),
parent_groups as (
  select * from groups where parent_group_id is null
)
insert into public.menu_groups (
  business_id,
  menu_id,
  parent_group_id,
  name,
  slug,
  description,
  display_style,
  is_enabled,
  show_online,
  show_on_print_menu,
  show_on_display_panels,
  sort_order
)
select
  pg.business_id,
  pg.menu_id,
  pg.id,
  x.name,
  x.slug,
  x.description,
  x.display_style,
  true,
  true,
  true,
  true,
  x.sort_order
from parent_groups pg
join (
  values
    ('pizza', 'Build Your Own', 'build-your-own', 'Choose size, crust, sauce, and toppings.', 'grid', 1),
    ('pizza', 'Specialty', 'specialty', 'House favorite specialty pizzas.', 'grid', 2),
    ('wings', 'Traditional', 'traditional', 'Bone-in wings by piece count.', 'grid', 1),
    ('wings', 'Boneless', 'boneless', 'Boneless wings by the pound.', 'grid', 2),
    ('subs', 'Hot Subs', 'hot-subs', 'Toasted subs and favorites.', 'grid', 1),
    ('subs', 'Cold Subs', 'cold-subs', 'Classic deli-style subs.', 'grid', 2),
    ('salads', 'Signature Salads', 'signature-salads', 'Fresh salad favorites.', 'grid', 1),
    ('drinks', 'Soda', 'soda', 'Bottled and fountain drinks.', 'list', 1),
    ('drinks', 'Coffee', 'coffee', 'Coffee drinks for cafe-style locations.', 'list', 2),
    ('sides', 'Dipping Sauces', 'dipping-sauces', 'Extra dipping sauces and cups.', 'grid', 1),
    ('sides', 'Bread', 'bread', 'Garlic bread, breadsticks, and cheese bread.', 'grid', 2)
) as x(parent_slug, name, slug, description, display_style, sort_order)
  on pg.slug = x.parent_slug
where not exists (
  select 1
  from public.menu_groups existing
  where existing.business_id = pg.business_id
    and existing.menu_id = pg.menu_id
    and existing.parent_group_id = pg.id
    and existing.slug = x.slug
);

-- =========================================================
-- Products
-- =========================================================

with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
)
insert into public.products (
  business_id,
  name,
  slug,
  description,
  base_price,
  builder_template,
  has_variants,
  prep_time_minutes,
  prep_time_type,
  is_enabled,
  is_taxable,
  is_featured
)
select
  b.business_id,
  x.name,
  x.slug,
  x.description,
  x.base_price,
  x.builder_template,
  x.has_variants,
  x.prep_time_minutes,
  'fixed',
  true,
  true,
  x.is_featured
from b
cross join (
  values
    ('Build Your Own Pizza', 'build-your-own-pizza', 'Start with cheese and customize your size, crust, sauce, and toppings.', null::numeric, 'pizza', true, 18, true),
    ('Pepperoni Pizza', 'pepperoni-pizza', 'Classic cheese pizza with pepperoni.', null::numeric, 'pizza', true, 18, true),
    ('Deluxe Pizza', 'deluxe-pizza', 'Pepperoni, sausage, mushrooms, onions, and green peppers.', null::numeric, 'pizza', true, 20, true),
    ('Traditional Wings', 'traditional-wings', 'Bone-in wings tossed in your choice of sauce.', null::numeric, 'wings', true, 14, true),
    ('Boneless Wings', 'boneless-wings', 'Boneless wings tossed in your choice of sauce.', null::numeric, 'wings', true, 12, false),
    ('Italian Sub', 'italian-sub', 'Ham, salami, pepperoni, provolone, lettuce, tomato, and Italian dressing.', null::numeric, 'sub', true, 8, false),
    ('Garden Salad', 'garden-salad', 'Lettuce, tomato, cucumber, onion, cheese, and your choice of dressing.', null::numeric, 'salad', true, 5, false),
    ('Pepsi', 'pepsi', 'Pepsi cola.', null::numeric, 'drink', true, 0, false),
    ('Mountain Dew', 'mountain-dew', 'Mountain Dew.', null::numeric, 'drink', true, 0, false),
    ('Espresso', 'espresso', 'Rich espresso shot.', 2.50, 'drink', false, 3, false),
    ('Cappuccino', 'cappuccino', 'Espresso with steamed milk and foam.', null::numeric, 'drink', true, 4, false),
    ('Ranch Cup', 'ranch-cup', 'Side cup of ranch dressing.', 0.75, 'standard', false, 0, false),
    ('Blue Cheese Cup', 'blue-cheese-cup', 'Side cup of blue cheese dressing.', 0.75, 'standard', false, 0, false),
    ('Marinara Cup', 'marinara-cup', 'Side cup of marinara sauce.', 0.75, 'standard', false, 0, false),
    ('Garlic Bread', 'garlic-bread', 'Toasted garlic bread.', 4.99, 'standard', false, 6, false)
) as x(name, slug, description, base_price, builder_template, has_variants, prep_time_minutes, is_featured)
where not exists (
  select 1
  from public.products p
  where p.business_id = b.business_id
    and p.slug = x.slug
);

-- =========================================================
-- Product Group Assignments
-- =========================================================

with b as (
  select id as business_id
  from public.businesses
  where slug = 'pronto-demo'
),
products as (
  select p.*
  from public.products p
  join b on b.business_id = p.business_id
),
groups as (
  select mg.*
  from public.menu_groups mg
  join b on b.business_id = mg.business_id
)
insert into public.product_groups (
  business_id,
  product_id,
  menu_group_id,
  is_primary,
  sort_order
)
select
  b.business_id,
  p.id,
  g.id,
  true,
  x.sort_order
from b
join (
  values
    ('build-your-own-pizza', 'build-your-own', 1),
    ('pepperoni-pizza', 'specialty', 1),
    ('deluxe-pizza', 'specialty', 2),
    ('traditional-wings', 'traditional', 1),
    ('boneless-wings', 'boneless', 1),
    ('italian-sub', 'hot-subs', 1),
    ('garden-salad', 'signature-salads', 1),
    ('pepsi', 'soda', 1),
    ('mountain-dew', 'soda', 2),
    ('espresso', 'coffee', 1),
    ('cappuccino', 'coffee', 2),
    ('ranch-cup', 'dipping-sauces', 1),
    ('blue-cheese-cup', 'dipping-sauces', 2),
    ('marinara-cup', 'dipping-sauces', 3),
    ('garlic-bread', 'bread', 1)
) as x(product_slug, group_slug, sort_order) on true
join products p on p.slug = x.product_slug
join groups g on g.slug = x.group_slug
on conflict (product_id, menu_group_id) do nothing;

-- =========================================================
-- Variants
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.*
  from public.products products
  join b on b.business_id = products.business_id
)
insert into public.product_variants (
  business_id,
  product_id,
  name,
  variant_type,
  unit_type,
  unit_quantity,
  unit_label,
  base_price,
  prep_time_minutes,
  is_default,
  is_enabled,
  sort_order
)
select
  p.business_id,
  p.id,
  x.name,
  x.variant_type,
  x.unit_type,
  x.unit_quantity,
  x.unit_label,
  x.base_price,
  x.prep_time_minutes,
  x.is_default,
  true,
  x.sort_order
from p
join (
  values
    ('build-your-own-pizza', '10"', 'size', 'size', 10, 'inch', 8.99, 16, true, 1),
    ('build-your-own-pizza', '12"', 'size', 'size', 12, 'inch', 11.99, 18, false, 2),
    ('build-your-own-pizza', '14"', 'size', 'size', 14, 'inch', 14.99, 20, false, 3),
    ('build-your-own-pizza', '16"', 'size', 'size', 16, 'inch', 17.99, 22, false, 4),

    ('pepperoni-pizza', '10"', 'size', 'size', 10, 'inch', 10.99, 16, true, 1),
    ('pepperoni-pizza', '12"', 'size', 'size', 12, 'inch', 13.99, 18, false, 2),
    ('pepperoni-pizza', '14"', 'size', 'size', 14, 'inch', 16.99, 20, false, 3),
    ('pepperoni-pizza', '16"', 'size', 'size', 16, 'inch', 19.99, 22, false, 4),

    ('deluxe-pizza', '10"', 'size', 'size', 10, 'inch', 12.99, 18, true, 1),
    ('deluxe-pizza', '12"', 'size', 'size', 12, 'inch', 15.99, 20, false, 2),
    ('deluxe-pizza', '14"', 'size', 'size', 14, 'inch', 18.99, 22, false, 3),
    ('deluxe-pizza', '16"', 'size', 'size', 16, 'inch', 21.99, 24, false, 4),

    ('traditional-wings', '6 Piece', 'count', 'count', 6, 'pieces', 7.99, 12, true, 1),
    ('traditional-wings', '12 Piece', 'count', 'count', 12, 'pieces', 14.99, 14, false, 2),
    ('traditional-wings', '24 Piece', 'count', 'count', 24, 'pieces', 27.99, 18, false, 3),

    ('boneless-wings', '1/2 lb', 'weight', 'weight', 0.5, 'lb', 6.99, 10, true, 1),
    ('boneless-wings', '1 lb', 'weight', 'weight', 1, 'lb', 11.99, 12, false, 2),
    ('boneless-wings', '2 lb', 'weight', 'weight', 2, 'lb', 21.99, 16, false, 3),

    ('italian-sub', '6"', 'size', 'size', 6, 'inch', 7.99, 7, true, 1),
    ('italian-sub', '12"', 'size', 'size', 12, 'inch', 12.99, 9, false, 2),

    ('garden-salad', 'Regular', 'portion', 'portion', 1, 'regular', 7.99, 5, true, 1),
    ('garden-salad', 'Large', 'portion', 'portion', 1, 'large', 10.99, 5, false, 2),

    ('pepsi', '20 oz', 'volume', 'volume', 20, 'oz', 2.49, 0, true, 1),
    ('pepsi', '2 Liter', 'volume', 'volume', 2, 'liter', 3.99, 0, false, 2),

    ('mountain-dew', '20 oz', 'volume', 'volume', 20, 'oz', 2.49, 0, true, 1),
    ('mountain-dew', '2 Liter', 'volume', 'volume', 2, 'liter', 3.99, 0, false, 2),

    ('cappuccino', 'Small', 'size', 'volume', 12, 'oz', 3.99, 4, true, 1),
    ('cappuccino', 'Large', 'size', 'volume', 20, 'oz', 5.49, 5, false, 2)
) as x(product_slug, name, variant_type, unit_type, unit_quantity, unit_label, base_price, prep_time_minutes, is_default, sort_order)
  on p.slug = x.product_slug
where not exists (
  select 1
  from public.product_variants pv
  where pv.product_id = p.id
    and pv.name = x.name
);

-- =========================================================
-- Modifier Groups
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
)
insert into public.modifier_groups (
  business_id,
  name,
  description,
  selection_type,
  min_required,
  max_allowed,
  is_required,
  supports_placement,
  supports_multiplier,
  min_multiplier,
  max_multiplier,
  multiplier_step,
  is_enabled,
  sort_order
)
select
  b.business_id,
  x.name,
  x.description,
  x.selection_type,
  x.min_required,
  x.max_allowed,
  x.is_required,
  x.supports_placement,
  x.supports_multiplier,
  x.min_multiplier,
  x.max_multiplier,
  x.multiplier_step,
  true,
  x.sort_order
from b
cross join (
  values
    ('Crust Type', 'Traditional or gluten-free crust base.', 'single', 1, 1, true, false, false, 1, 1, 1, 1),
    ('Crust Style', 'Thin, regular, or thick crust style.', 'single', 1, 1, true, false, false, 1, 1, 1, 2),
    ('Pizza Sauce', 'Pizza sauce options.', 'single', 1, 1, true, false, false, 1, 1, 1, 3),
    ('Pizza Toppings', 'Pizza toppings with placement and quantity support.', 'multiple', 0, null::integer, false, true, true, 1, 3, 1, 4),
    ('Wing Sauce', 'Wing sauce options.', 'multiple', 1, 2, true, false, false, 1, 1, 1, 5),
    ('Sub Bread', 'Sub bread options.', 'single', 1, 1, true, false, false, 1, 1, 1, 6),
    ('Sub Extras', 'Extra sub add-ons.', 'multiple', 0, null::integer, false, false, true, 1, 3, 1, 7),
    ('Salad Dressing', 'Dressing choice.', 'single', 1, 1, true, false, false, 1, 1, 1, 8),
    ('Salad Protein', 'Optional protein add-ons.', 'multiple', 0, 2, false, false, true, 1, 2, 1, 9),
    ('Coffee Milk', 'Milk options for coffee drinks.', 'single', 0, 1, false, false, false, 1, 1, 1, 10),
    ('Flavor Shots', 'Coffee flavor shots.', 'multiple', 0, 4, false, false, true, 1, 4, 1, 11)
) as x(name, description, selection_type, min_required, max_allowed, is_required, supports_placement, supports_multiplier, min_multiplier, max_multiplier, multiplier_step, sort_order)
where not exists (
  select 1
  from public.modifier_groups mg
  where mg.business_id = b.business_id
    and mg.name = x.name
);

-- =========================================================
-- Modifier Options
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
mg as (
  select modifier_groups.*
  from public.modifier_groups
  join b on b.business_id = modifier_groups.business_id
)
insert into public.modifier_options (
  business_id,
  modifier_group_id,
  name,
  description,
  price_delta,
  prep_time_delta_minutes,
  is_enabled,
  sort_order
)
select
  mg.business_id,
  mg.id,
  x.option_name,
  null,
  x.price_delta,
  x.prep_time_delta_minutes,
  true,
  x.sort_order
from mg
join (
  values
    ('Crust Type', 'Traditional', 0.00, 0, 1),
    ('Crust Type', 'Gluten Free', 3.00, 0, 2),

    ('Crust Style', 'Regular', 0.00, 0, 1),
    ('Crust Style', 'Thin', 0.00, 0, 2),
    ('Crust Style', 'Thick', 1.50, 2, 3),

    ('Pizza Sauce', 'Classic Red Sauce', 0.00, 0, 1),
    ('Pizza Sauce', 'Garlic Butter', 0.50, 0, 2),
    ('Pizza Sauce', 'BBQ Sauce', 0.50, 0, 3),

    ('Pizza Toppings', 'Pepperoni', 1.50, 0, 1),
    ('Pizza Toppings', 'Sausage', 1.50, 0, 2),
    ('Pizza Toppings', 'Ham', 1.50, 0, 3),
    ('Pizza Toppings', 'Mushrooms', 1.25, 0, 4),
    ('Pizza Toppings', 'Onions', 1.00, 0, 5),
    ('Pizza Toppings', 'Green Peppers', 1.00, 0, 6),
    ('Pizza Toppings', 'Extra Cheese', 1.75, 0, 7),
    ('Pizza Toppings', 'Bacon', 2.00, 0, 8),

    ('Wing Sauce', 'Mild', 0.00, 0, 1),
    ('Wing Sauce', 'Hot', 0.00, 0, 2),
    ('Wing Sauce', 'BBQ', 0.00, 0, 3),
    ('Wing Sauce', 'Garlic Parmesan', 0.50, 0, 4),

    ('Sub Bread', 'White', 0.00, 0, 1),
    ('Sub Bread', 'Wheat', 0.00, 0, 2),
    ('Sub Bread', 'Italian Herb', 0.50, 0, 3),

    ('Sub Extras', 'Extra Ham', 1.25, 0, 1),
    ('Sub Extras', 'Extra Cheese', 1.00, 0, 2),
    ('Sub Extras', 'Bacon', 1.75, 0, 3),

    ('Salad Dressing', 'Ranch', 0.00, 0, 1),
    ('Salad Dressing', 'Italian', 0.00, 0, 2),
    ('Salad Dressing', 'Blue Cheese', 0.00, 0, 3),

    ('Salad Protein', 'Grilled Chicken', 3.50, 4, 1),
    ('Salad Protein', 'Ham', 2.25, 0, 2),
    ('Salad Protein', 'Bacon', 2.00, 0, 3),

    ('Coffee Milk', 'Whole Milk', 0.00, 0, 1),
    ('Coffee Milk', 'Oat Milk', 0.75, 0, 2),
    ('Coffee Milk', 'Almond Milk', 0.75, 0, 3),

    ('Flavor Shots', 'Vanilla', 0.75, 0, 1),
    ('Flavor Shots', 'Caramel', 0.75, 0, 2),
    ('Flavor Shots', 'Hazelnut', 0.75, 0, 3),
    ('Flavor Shots', 'Extra Espresso Shot', 1.25, 1, 4)
) as x(group_name, option_name, price_delta, prep_time_delta_minutes, sort_order)
  on mg.name = x.group_name
where not exists (
  select 1
  from public.modifier_options mo
  where mo.modifier_group_id = mg.id
    and mo.name = x.option_name
);

-- =========================================================
-- Assign Modifier Groups To Products
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
),
mg as (
  select modifier_groups.* from public.modifier_groups join b on b.business_id = modifier_groups.business_id
)
insert into public.product_modifier_groups (
  business_id,
  product_id,
  modifier_group_id,
  is_enabled,
  sort_order
)
select
  b.business_id,
  p.id,
  mg.id,
  true,
  x.sort_order
from b
join (
  values
    ('build-your-own-pizza', 'Crust Type', 1),
    ('build-your-own-pizza', 'Crust Style', 2),
    ('build-your-own-pizza', 'Pizza Sauce', 3),
    ('build-your-own-pizza', 'Pizza Toppings', 4),

    ('pepperoni-pizza', 'Crust Type', 1),
    ('pepperoni-pizza', 'Crust Style', 2),
    ('pepperoni-pizza', 'Pizza Sauce', 3),
    ('pepperoni-pizza', 'Pizza Toppings', 4),

    ('deluxe-pizza', 'Crust Type', 1),
    ('deluxe-pizza', 'Crust Style', 2),
    ('deluxe-pizza', 'Pizza Sauce', 3),
    ('deluxe-pizza', 'Pizza Toppings', 4),

    ('traditional-wings', 'Wing Sauce', 1),
    ('boneless-wings', 'Wing Sauce', 1),

    ('italian-sub', 'Sub Bread', 1),
    ('italian-sub', 'Sub Extras', 2),

    ('garden-salad', 'Salad Dressing', 1),
    ('garden-salad', 'Salad Protein', 2),

    ('cappuccino', 'Coffee Milk', 1),
    ('cappuccino', 'Flavor Shots', 2),
    ('espresso', 'Flavor Shots', 1)
) as x(product_slug, group_name, sort_order) on true
join p on p.slug = x.product_slug
join mg on mg.name = x.group_name
on conflict (product_id, modifier_group_id) do update
set
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order,
  updated_at = now();

-- =========================================================
-- Pizza Variant-Specific Topping Prices
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
  where products.builder_template = 'pizza'
),
pv as (
  select product_variants.*
  from public.product_variants
  join p on p.id = product_variants.product_id
),
mg as (
  select modifier_groups.* from public.modifier_groups join b on b.business_id = modifier_groups.business_id
  where modifier_groups.name = 'Pizza Toppings'
),
mo as (
  select modifier_options.*
  from public.modifier_options
  join mg on mg.id = modifier_options.modifier_group_id
)
insert into public.product_modifier_option_price_rules (
  business_id,
  product_id,
  product_variant_id,
  modifier_group_id,
  modifier_option_id,
  location_id,
  price_delta,
  prep_time_delta_minutes,
  is_enabled
)
select
  p.business_id,
  p.id,
  pv.id,
  mg.id,
  mo.id,
  null,
  case
    when pv.name = '10"' then
      case when mo.name in ('Bacon', 'Extra Cheese') then 1.75 else 1.25 end
    when pv.name = '12"' then
      case when mo.name in ('Bacon', 'Extra Cheese') then 2.00 else 1.50 end
    when pv.name = '14"' then
      case when mo.name in ('Bacon', 'Extra Cheese') then 2.25 else 1.75 end
    when pv.name = '16"' then
      case when mo.name in ('Bacon', 'Extra Cheese') then 2.50 else 2.00 end
    else mo.price_delta
  end,
  0,
  true
from p
join pv on pv.product_id = p.id
cross join mg
join mo on mo.modifier_group_id = mg.id
where not exists (
  select 1
  from public.product_modifier_option_price_rules existing
  where existing.product_id = p.id
    and existing.product_variant_id = pv.id
    and existing.modifier_option_id = mo.id
);

-- =========================================================
-- Gluten-Free Availability Rule
-- Gluten Free crust type is only available on 10 inch pizza variants.
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
  where products.builder_template = 'pizza'
),
pv as (
  select product_variants.*
  from public.product_variants
  join p on p.id = product_variants.product_id
),
mg as (
  select modifier_groups.* from public.modifier_groups join b on b.business_id = modifier_groups.business_id
  where modifier_groups.name = 'Crust Type'
),
mo as (
  select modifier_options.*
  from public.modifier_options
  join mg on mg.id = modifier_options.modifier_group_id
  where modifier_options.name = 'Gluten Free'
)
insert into public.product_modifier_option_availability_rules (
  business_id,
  product_id,
  product_variant_id,
  modifier_group_id,
  modifier_option_id,
  location_id,
  is_enabled,
  is_available
)
select
  p.business_id,
  p.id,
  pv.id,
  mg.id,
  mo.id,
  null,
  true,
  case when pv.name = '10"' then true else false end
from p
join pv on pv.product_id = p.id
cross join mg
cross join mo
where not exists (
  select 1
  from public.product_modifier_option_availability_rules existing
  where existing.product_id = p.id
    and existing.product_variant_id = pv.id
    and existing.modifier_option_id = mo.id
);

-- =========================================================
-- Crust Style Dependency Rules
-- Thick crust is only available when Traditional crust type is selected.
-- Regular/Thin are available for Traditional and Gluten Free.
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
  where products.builder_template = 'pizza'
),
crust_style_group as (
  select * from public.modifier_groups mg join b on b.business_id = mg.business_id where mg.name = 'Crust Style'
),
crust_type_group as (
  select * from public.modifier_groups mg join b on b.business_id = mg.business_id where mg.name = 'Crust Type'
),
styles as (
  select mo.* from public.modifier_options mo join crust_style_group csg on csg.id = mo.modifier_group_id
),
types as (
  select mo.* from public.modifier_options mo join crust_type_group ctg on ctg.id = mo.modifier_group_id
)
insert into public.modifier_option_dependency_rules (
  business_id,
  product_id,
  product_variant_id,
  modifier_group_id,
  modifier_option_id,
  depends_on_modifier_group_id,
  depends_on_modifier_option_id,
  is_available,
  is_enabled
)
select
  p.business_id,
  p.id,
  null,
  csg.id,
  styles.id,
  ctg.id,
  types.id,
  case
    when styles.name = 'Thick' and types.name = 'Gluten Free' then false
    else true
  end,
  true
from p
cross join crust_style_group csg
cross join crust_type_group ctg
join styles on styles.modifier_group_id = csg.id
join types on types.modifier_group_id = ctg.id
where not exists (
  select 1
  from public.modifier_option_dependency_rules existing
  where existing.product_id = p.id
    and existing.modifier_option_id = styles.id
    and existing.depends_on_modifier_option_id = types.id
);

-- =========================================================
-- Included Modifier Credits / Defaults
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
),
mg as (
  select modifier_groups.* from public.modifier_groups join b on b.business_id = modifier_groups.business_id
  where name = 'Pizza Toppings'
)
insert into public.product_included_modifier_groups (
  business_id,
  product_id,
  product_variant_id,
  modifier_group_id,
  included_quantity,
  is_swappable,
  charge_for_extra
)
select
  p.business_id,
  p.id,
  null,
  mg.id,
  x.included_quantity,
  x.is_swappable,
  true
from p
join (
  values
    ('build-your-own-pizza', 0.00, true),
    ('pepperoni-pizza', 1.00, true),
    ('deluxe-pizza', 5.00, true)
) as x(product_slug, included_quantity, is_swappable)
  on p.slug = x.product_slug
cross join mg
where not exists (
  select 1
  from public.product_included_modifier_groups existing
  where existing.product_id = p.id
    and existing.modifier_group_id = mg.id
    and existing.product_variant_id is null
);

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
),
mg as (
  select modifier_groups.* from public.modifier_groups join b on b.business_id = modifier_groups.business_id
  where name = 'Pizza Toppings'
),
mo as (
  select modifier_options.* from public.modifier_options join mg on mg.id = modifier_options.modifier_group_id
)
insert into public.product_default_modifier_options (
  business_id,
  product_id,
  product_variant_id,
  modifier_group_id,
  modifier_option_id,
  quantity,
  is_removable
)
select
  p.business_id,
  p.id,
  null,
  mg.id,
  mo.id,
  1,
  true
from p
join (
  values
    ('pepperoni-pizza', 'Pepperoni'),
    ('deluxe-pizza', 'Pepperoni'),
    ('deluxe-pizza', 'Sausage'),
    ('deluxe-pizza', 'Mushrooms'),
    ('deluxe-pizza', 'Onions'),
    ('deluxe-pizza', 'Green Peppers')
) as x(product_slug, option_name)
  on p.slug = x.product_slug
cross join mg
join mo on mo.name = x.option_name
where not exists (
  select 1
  from public.product_default_modifier_options existing
  where existing.product_id = p.id
    and existing.modifier_option_id = mo.id
    and existing.product_variant_id is null
);

-- =========================================================
-- Related Add-ons
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
p as (
  select products.* from public.products products join b on b.business_id = products.business_id
)
insert into public.product_related_items (
  business_id,
  source_product_id,
  related_product_id,
  relationship_type,
  display_label,
  is_required,
  auto_remove_with_parent,
  allow_independent_purchase,
  min_quantity,
  max_quantity,
  default_quantity,
  is_enabled,
  sort_order
)
select
  b.business_id,
  source.id,
  related.id,
  x.relationship_type,
  x.display_label,
  false,
  x.auto_remove_with_parent,
  x.allow_independent_purchase,
  0,
  x.max_quantity,
  0,
  true,
  x.sort_order
from b
join (
  values
    ('traditional-wings', 'ranch-cup', 'addon', 'Add dipping sauces', true, false, 6, 1),
    ('traditional-wings', 'blue-cheese-cup', 'addon', 'Add dipping sauces', true, false, 6, 2),
    ('boneless-wings', 'ranch-cup', 'addon', 'Add dipping sauces', true, false, 6, 1),
    ('boneless-wings', 'blue-cheese-cup', 'addon', 'Add dipping sauces', true, false, 6, 2),
    ('garlic-bread', 'marinara-cup', 'addon', 'Add dipping sauces', true, false, 4, 1),
    ('build-your-own-pizza', 'garlic-bread', 'side', 'Add a side', false, true, 4, 1),
    ('pepperoni-pizza', 'garlic-bread', 'side', 'Add a side', false, true, 4, 1),
    ('deluxe-pizza', 'garlic-bread', 'side', 'Add a side', false, true, 4, 1)
) as x(source_slug, related_slug, relationship_type, display_label, auto_remove_with_parent, allow_independent_purchase, max_quantity, sort_order)
  on true
join p source on source.slug = x.source_slug
join p related on related.slug = x.related_slug
where not exists (
  select 1
  from public.product_related_items existing
  where existing.source_product_id = source.id
    and existing.related_product_id = related.id
);

-- =========================================================
-- Charges
-- =========================================================

with b as (
  select id as business_id from public.businesses where slug = 'pronto-demo'
),
l as (
  select locations.* from public.locations locations join b on b.business_id = locations.business_id where locations.slug = 'main-street'
)
insert into public.charges (
  business_id,
  location_id,
  name,
  description,
  charge_type,
  amount,
  applies_to,
  calculation_base,
  is_taxable,
  is_enabled,
  show_to_customer,
  min_order_amount,
  max_charge_amount,
  sort_order
)
select
  b.business_id,
  null,
  x.name,
  x.description,
  x.charge_type,
  x.amount,
  x.applies_to,
  x.calculation_base,
  x.is_taxable,
  true,
  true,
  x.min_order_amount,
  x.max_charge_amount,
  x.sort_order
from b
cross join (
  values
    ('Service Fee', 'Small online ordering service fee.', 'flat', 1.25, 'all', 'subtotal', false, null::numeric, null::numeric, 1),
    ('Delivery Fee', 'Delivery fee for local delivery orders.', 'flat', 4.00, 'delivery', 'subtotal', false, null::numeric, null::numeric, 2),
    ('Large Order Auto Gratuity', 'Auto gratuity for larger orders.', 'percentage', 15.00, 'all', 'subtotal_after_discounts', false, 100.00, 25.00, 3)
) as x(name, description, charge_type, amount, applies_to, calculation_base, is_taxable, min_order_amount, max_charge_amount, sort_order)
where not exists (
  select 1
  from public.charges c
  where c.business_id = b.business_id
    and c.name = x.name
);

commit;
