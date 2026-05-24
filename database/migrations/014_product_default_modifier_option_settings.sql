alter table if exists public.product_default_modifier_options
add column if not exists placement text not null default 'whole'
check (placement in ('left', 'whole', 'right'));

alter table if exists public.product_default_modifier_options
add column if not exists multiplier numeric(6,2) not null default 1;

alter table if exists public.product_default_modifier_options
add column if not exists is_enabled boolean not null default true;

alter table if exists public.product_default_modifier_options
add column if not exists sort_order integer not null default 0;

create index if not exists idx_product_default_modifier_options_product
on public.product_default_modifier_options(product_id);

create index if not exists idx_product_default_modifier_options_group
on public.product_default_modifier_options(modifier_group_id);

create unique index if not exists idx_product_default_modifier_options_unique
on public.product_default_modifier_options(product_id, modifier_group_id, modifier_option_id);
