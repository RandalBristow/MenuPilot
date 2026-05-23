begin;

do $$
begin
  if to_regclass('public.modifier_group_categories') is not null
    and to_regclass('public.modifier_categories') is null then
    alter table public.modifier_group_categories
    rename to modifier_categories;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'modifier_groups'
      and column_name = 'modifier_group_category_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'modifier_groups'
      and column_name = 'modifier_category_id'
  ) then
    alter table public.modifier_groups
    rename column modifier_group_category_id to modifier_category_id;
  end if;
end $$;

do $$
begin
  if to_regclass('public.modifier_categories') is null then
    return;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'modifier_group_categories_pkey'
      and conrelid = 'public.modifier_categories'::regclass
  ) then
    alter table public.modifier_categories
    rename constraint modifier_group_categories_pkey to modifier_categories_pkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'modifier_group_categories_business_id_name_key'
      and conrelid = 'public.modifier_categories'::regclass
  ) then
    alter table public.modifier_categories
    rename constraint modifier_group_categories_business_id_name_key
    to modifier_categories_business_id_name_key;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'modifier_groups_modifier_group_category_id_fkey'
      and conrelid = 'public.modifier_groups'::regclass
  ) then
    alter table public.modifier_groups
    rename constraint modifier_groups_modifier_group_category_id_fkey
    to modifier_groups_modifier_category_id_fkey;
  end if;
end $$;

alter index if exists public.idx_modifier_group_categories_business_id
rename to idx_modifier_categories_business_id;

alter index if exists public.idx_modifier_groups_category_id
rename to idx_modifier_groups_modifier_category_id;

commit;
