alter table if exists public.order_items
add column if not exists variant_group_option_id uuid
references public.variant_group_options(id) on delete set null;

alter table if exists public.order_item_modifiers
add column if not exists modifier_group_id uuid
references public.modifier_groups(id) on delete set null;

alter table if exists public.order_item_modifiers
add column if not exists modifier_option_id uuid
references public.modifier_options(id) on delete set null;

create index if not exists idx_order_items_variant_group_option_id
on public.order_items(variant_group_option_id);

create index if not exists idx_order_item_modifiers_modifier_group_id
on public.order_item_modifiers(modifier_group_id);

create index if not exists idx_order_item_modifiers_modifier_option_id
on public.order_item_modifiers(modifier_option_id);
