-- 001_initial_schema.sql
-- MenuPilot initial database foundation

create extension if not exists "pgcrypto";

-- =========================================================
-- Utility
-- =========================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- Profiles / Businesses / Locations
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'staff', 'marketing')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  slug text not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text not null default 'US',
  phone text,
  email text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  timezone text not null default 'America/New_York',
  google_place_id text,
  google_maps_url text,
  google_review_url text,
  is_enabled boolean not null default true,
  accepting_orders boolean not null default true,
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default false,
  default_prep_time_minutes integer not null default 15,
  rush_prep_time_minutes integer not null default 30,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

create table public.location_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('manager', 'staff')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, user_id)
);

-- =========================================================
-- Hours
-- =========================================================

create table public.location_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, day_of_week)
);

create table public.location_hour_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  date date not null,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, date)
);

-- =========================================================
-- Media Library
-- =========================================================

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  public_url text,
  file_name text,
  mime_type text,
  file_size integer,
  alt_text text,
  caption text,
  tags text[] not null default '{}',
  folder text,
  is_archived boolean not null default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Menus / Groups / Products
-- =========================================================

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  name text not null,
  description text,
  menu_type text not null default 'online',
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  parent_group_id uuid references public.menu_groups(id) on delete cascade,
  name text not null,
  slug text,
  description text,
  image_media_id uuid references public.media_assets(id) on delete set null,
  display_style text not null default 'grid',
  is_enabled boolean not null default true,
  show_online boolean not null default true,
  show_on_print_menu boolean not null default true,
  show_on_display_panels boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  slug text,
  description text,
  base_price numeric(10,2),
  sku text,
  image_media_id uuid references public.media_assets(id) on delete set null,
  builder_template text not null default 'standard'
    check (builder_template in ('standard', 'pizza', 'wings', 'sub', 'salad', 'drink', 'combo')),
  has_variants boolean not null default false,
  prep_time_minutes integer not null default 0,
  prep_time_type text not null default 'fixed',
  is_enabled boolean not null default true,
  is_taxable boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  menu_group_id uuid not null references public.menu_groups(id) on delete cascade,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, menu_group_id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  variant_type text not null default 'size',
  unit_type text,
  unit_quantity numeric(10,2),
  unit_label text,
  base_price numeric(10,2) not null default 0,
  prep_time_minutes integer not null default 0,
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_location_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price_override numeric(10,2),
  is_enabled boolean,
  is_available boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, product_id)
);

-- =========================================================
-- Modifiers
-- =========================================================

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  selection_type text not null default 'single' check (selection_type in ('single', 'multiple')),
  min_required integer not null default 0,
  max_allowed integer,
  is_required boolean not null default false,
  supports_placement boolean not null default false,
  supports_multiplier boolean not null default false,
  min_multiplier numeric(4,2) not null default 1,
  max_multiplier numeric(4,2) not null default 1,
  multiplier_step numeric(4,2) not null default 1,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  description text,
  price_delta numeric(10,2) not null default 0,
  prep_time_delta_minutes integer not null default 0,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_modifier_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, modifier_group_id)
);

create table public.product_modifier_option_price_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  price_delta numeric(10,2) not null,
  prep_time_delta_minutes integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_modifier_option_availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  is_enabled boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modifier_option_dependency_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  depends_on_modifier_group_id uuid references public.modifier_groups(id) on delete cascade,
  depends_on_modifier_option_id uuid references public.modifier_options(id) on delete cascade,
  is_available boolean not null default true,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Included Defaults / Credits
-- =========================================================

create table public.product_included_modifier_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  included_quantity numeric(6,2) not null default 0,
  is_swappable boolean not null default true,
  charge_for_extra boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_default_modifier_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  modifier_option_id uuid not null references public.modifier_options(id) on delete cascade,
  quantity numeric(6,2) not null default 1,
  is_removable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Related Add-ons
-- =========================================================

create table public.product_related_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_product_id uuid not null references public.products(id) on delete cascade,
  related_product_id uuid not null references public.products(id) on delete cascade,
  relationship_type text not null default 'addon',
  display_label text,
  is_required boolean not null default false,
  auto_remove_with_parent boolean not null default true,
  allow_independent_purchase boolean not null default false,
  min_quantity integer not null default 0,
  max_quantity integer,
  default_quantity integer not null default 0,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Orders / Payments / Charges
-- =========================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  order_number text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery', 'dine_in', 'curbside')),
  order_status text not null default 'new',
  payment_status text not null default 'unpaid',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  tip_total numeric(10,2) not null default 0,
  charge_total numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  special_instructions text,
  requested_time timestamptz,
  estimated_prep_minutes integer,
  estimated_ready_at timestamptz,
  prep_time_source text,
  accepted_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  parent_order_item_id uuid references public.order_items(id) on delete cascade,
  relationship_type text,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0,
  line_subtotal numeric(10,2) not null default 0,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_group_id uuid references public.modifier_groups(id) on delete set null,
  modifier_option_id uuid references public.modifier_options(id) on delete set null,
  group_name_snapshot text not null,
  option_name_snapshot text not null,
  placement text not null default 'whole',
  multiplier numeric(4,2) not null default 1,
  price_delta numeric(10,2) not null default 0,
  quantity numeric(6,2) not null default 1,
  created_at timestamptz not null default now()
);

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  name text not null,
  description text,
  charge_type text not null check (charge_type in ('flat', 'percentage')),
  amount numeric(10,2) not null,
  applies_to text not null default 'all' check (applies_to in ('pickup', 'delivery', 'all')),
  calculation_base text not null default 'subtotal',
  is_taxable boolean not null default false,
  is_enabled boolean not null default true,
  show_to_customer boolean not null default true,
  min_order_amount numeric(10,2),
  max_charge_amount numeric(10,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_charges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  charge_id uuid references public.charges(id) on delete set null,
  name_snapshot text not null,
  amount numeric(10,2) not null,
  is_taxable boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'stripe',
  provider_payment_intent_id text,
  provider_checkout_session_id text,
  amount numeric(10,2) not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Indexes
-- =========================================================

create index idx_locations_business_id on public.locations(business_id);
create index idx_business_users_user_id on public.business_users(user_id);
create index idx_location_users_user_id on public.location_users(user_id);
create index idx_menus_business_location on public.menus(business_id, location_id);
create index idx_menu_groups_menu_parent on public.menu_groups(menu_id, parent_group_id);
create index idx_products_business_id on public.products(business_id);
create index idx_product_groups_group_id on public.product_groups(menu_group_id);
create index idx_product_variants_product_id on public.product_variants(product_id);
create index idx_modifier_options_group_id on public.modifier_options(modifier_group_id);
create index idx_product_modifier_groups_product_id on public.product_modifier_groups(product_id);
create index idx_orders_location_status on public.orders(location_id, order_status);
create index idx_orders_created_at on public.orders(created_at);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_item_modifiers_order_item_id on public.order_item_modifiers(order_item_id);

-- =========================================================
-- Updated_at triggers
-- =========================================================

create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_businesses_updated_at before update on public.businesses
for each row execute function public.set_updated_at();

create trigger set_business_users_updated_at before update on public.business_users
for each row execute function public.set_updated_at();

create trigger set_locations_updated_at before update on public.locations
for each row execute function public.set_updated_at();

create trigger set_location_users_updated_at before update on public.location_users
for each row execute function public.set_updated_at();

create trigger set_location_hours_updated_at before update on public.location_hours
for each row execute function public.set_updated_at();

create trigger set_location_hour_overrides_updated_at before update on public.location_hour_overrides
for each row execute function public.set_updated_at();

create trigger set_media_assets_updated_at before update on public.media_assets
for each row execute function public.set_updated_at();

create trigger set_menus_updated_at before update on public.menus
for each row execute function public.set_updated_at();

create trigger set_menu_groups_updated_at before update on public.menu_groups
for each row execute function public.set_updated_at();

create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

create trigger set_product_variants_updated_at before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger set_product_location_overrides_updated_at before update on public.product_location_overrides
for each row execute function public.set_updated_at();

create trigger set_modifier_groups_updated_at before update on public.modifier_groups
for each row execute function public.set_updated_at();

create trigger set_modifier_options_updated_at before update on public.modifier_options
for each row execute function public.set_updated_at();

create trigger set_product_modifier_groups_updated_at before update on public.product_modifier_groups
for each row execute function public.set_updated_at();

create trigger set_product_modifier_option_price_rules_updated_at before update on public.product_modifier_option_price_rules
for each row execute function public.set_updated_at();

create trigger set_product_modifier_option_availability_rules_updated_at before update on public.product_modifier_option_availability_rules
for each row execute function public.set_updated_at();

create trigger set_modifier_option_dependency_rules_updated_at before update on public.modifier_option_dependency_rules
for each row execute function public.set_updated_at();

create trigger set_product_included_modifier_groups_updated_at before update on public.product_included_modifier_groups
for each row execute function public.set_updated_at();

create trigger set_product_default_modifier_options_updated_at before update on public.product_default_modifier_options
for each row execute function public.set_updated_at();

create trigger set_product_related_items_updated_at before update on public.product_related_items
for each row execute function public.set_updated_at();

create trigger set_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create trigger set_charges_updated_at before update on public.charges
for each row execute function public.set_updated_at();

create trigger set_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();