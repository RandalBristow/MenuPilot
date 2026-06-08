begin;

create table if not exists public.special_availability_windows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  special_id uuid not null references public.specials(id) on delete cascade,
  day_of_week integer not null,
  start_time time,
  end_time time,
  is_all_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_availability_windows_day_check
    check (day_of_week between 0 and 6),
  constraint special_availability_windows_time_check
    check (
      (is_all_day = true and start_time is null and end_time is null)
      or
      (
        is_all_day = false
        and start_time is not null
        and end_time is not null
        and start_time < end_time
      )
    )
);

create or replace function public.validate_special_availability_window_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.specials s
    where s.id = new.special_id
      and s.business_id = new.business_id
  ) then
    raise exception 'Special availability window must match the special business.';
  end if;

  return new;
end;
$$;

create index if not exists special_availability_windows_business_special_idx
on public.special_availability_windows (business_id, special_id);

create index if not exists special_availability_windows_special_day_idx
on public.special_availability_windows (special_id, day_of_week);

alter table public.special_availability_windows enable row level security;

drop policy if exists "special_availability_windows_public_read_enabled"
  on public.special_availability_windows;
drop policy if exists "special_availability_windows_admin_manage"
  on public.special_availability_windows;

create policy "special_availability_windows_public_read_enabled"
on public.special_availability_windows
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.specials s
    where s.id = special_availability_windows.special_id
      and s.is_enabled = true
      and s.business_id = special_availability_windows.business_id
      and exists (
        select 1
        from public.businesses b
        where b.id = s.business_id
          and b.status = 'active'
      )
  )
);

create policy "special_availability_windows_admin_manage"
on public.special_availability_windows
for all
to authenticated
using (public.can_manage_business_content(business_id))
with check (public.can_manage_business_content(business_id));

drop trigger if exists set_special_availability_windows_updated_at
  on public.special_availability_windows;

create trigger set_special_availability_windows_updated_at
before update on public.special_availability_windows
for each row execute function public.set_updated_at();

drop trigger if exists validate_special_availability_window_scope
  on public.special_availability_windows;

create trigger validate_special_availability_window_scope
before insert or update on public.special_availability_windows
for each row execute function public.validate_special_availability_window_scope();

commit;
