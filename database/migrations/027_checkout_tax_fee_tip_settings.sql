begin;

alter table public.business_pricing_settings
add column if not exists sales_tax_rate_percent numeric(7,4) not null default 0,
add column if not exists service_fee_type text not null default 'none',
add column if not exists service_fee_value numeric(10,2) not null default 0,
add column if not exists tips_enabled boolean not null default false;

alter table public.business_pricing_settings
drop constraint if exists business_pricing_settings_sales_tax_rate_percent_check;

alter table public.business_pricing_settings
add constraint business_pricing_settings_sales_tax_rate_percent_check
  check (sales_tax_rate_percent >= 0);

alter table public.business_pricing_settings
drop constraint if exists business_pricing_settings_service_fee_type_check;

alter table public.business_pricing_settings
add constraint business_pricing_settings_service_fee_type_check
  check (service_fee_type in ('none', 'fixed', 'percentage'));

alter table public.business_pricing_settings
drop constraint if exists business_pricing_settings_service_fee_value_check;

alter table public.business_pricing_settings
add constraint business_pricing_settings_service_fee_value_check
  check (service_fee_value >= 0);

alter table public.orders
add column if not exists tax_rate_percent_snapshot numeric(7,4) not null default 0,
add column if not exists service_fee_type_snapshot text not null default 'none',
add column if not exists service_fee_value_snapshot numeric(10,2) not null default 0,
add column if not exists tip_basis_snapshot text not null default 'discounted_subtotal';

alter table public.orders
drop constraint if exists orders_tax_rate_percent_snapshot_check;

alter table public.orders
add constraint orders_tax_rate_percent_snapshot_check
  check (tax_rate_percent_snapshot >= 0);

alter table public.orders
drop constraint if exists orders_service_fee_type_snapshot_check;

alter table public.orders
add constraint orders_service_fee_type_snapshot_check
  check (service_fee_type_snapshot in ('none', 'fixed', 'percentage'));

alter table public.orders
drop constraint if exists orders_service_fee_value_snapshot_check;

alter table public.orders
add constraint orders_service_fee_value_snapshot_check
  check (service_fee_value_snapshot >= 0);

alter table public.orders
drop constraint if exists orders_tip_basis_snapshot_check;

alter table public.orders
add constraint orders_tip_basis_snapshot_check
  check (tip_basis_snapshot in ('discounted_subtotal'));

commit;
