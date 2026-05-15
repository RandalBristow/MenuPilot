-- Enforce one active reusable variant group assignment per product.

do $$
begin
  if to_regclass('public.product_variant_groups') is not null then
    create unique index if not exists idx_product_variant_groups_one_enabled_per_product
      on public.product_variant_groups (product_id)
      where is_enabled = true;
  end if;
end $$;
