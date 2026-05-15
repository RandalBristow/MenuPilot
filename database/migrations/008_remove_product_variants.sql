-- Remove the legacy product-specific variants system.
-- Reusable variant groups are now the source of product variant choices.

alter table if exists public.order_items
  drop column if exists product_variant_id;

alter table if exists public.product_modifier_option_price_rules
  drop column if exists product_variant_id;

alter table if exists public.product_modifier_option_availability_rules
  drop column if exists product_variant_id;

alter table if exists public.modifier_option_dependency_rules
  drop column if exists product_variant_id;

alter table if exists public.product_included_modifier_groups
  drop column if exists product_variant_id;

alter table if exists public.product_default_modifier_options
  drop column if exists product_variant_id;

drop table if exists public.product_variants;
