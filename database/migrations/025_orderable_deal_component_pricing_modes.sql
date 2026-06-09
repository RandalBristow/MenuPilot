begin;

alter table public.special_components
add column if not exists pricing_mode text not null default 'included',
add column if not exists fixed_price numeric(10,2);

alter table public.special_components
drop constraint if exists special_components_pricing_mode_check;

alter table public.special_components
add constraint special_components_pricing_mode_check
  check (pricing_mode in ('included', 'fixed_price', 'normal_price'));

alter table public.special_components
drop constraint if exists special_components_fixed_price_nonnegative_check;

alter table public.special_components
add constraint special_components_fixed_price_nonnegative_check
  check (fixed_price is null or fixed_price >= 0);

alter table public.special_components
drop constraint if exists special_components_fixed_price_required_check;

alter table public.special_components
add constraint special_components_fixed_price_required_check
  check (pricing_mode <> 'fixed_price' or fixed_price is not null);

commit;
