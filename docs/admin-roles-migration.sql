-- Admin roles + broker/seller application queues.
-- Run this in Supabase Dashboard → SQL Editor.

do $$ begin create type public.app_role as enum ('admin','moderator','user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
drop policy if exists "users read own roles" on public.user_roles;
create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

create table if not exists public.broker_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null, contact_name text not null,
  email text not null, phone text,
  tier text not null check (tier in ('starter','pro','elite')),
  monthly_volume text, notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  status_reason text, created_at timestamptz not null default now(), reviewed_at timestamptz
);
grant select, insert on public.broker_applications to anon, authenticated;
grant all on public.broker_applications to service_role;
alter table public.broker_applications enable row level security;
drop policy if exists "anyone can apply as broker" on public.broker_applications;
create policy "anyone can apply as broker" on public.broker_applications
  for insert to anon, authenticated with check (true);
drop policy if exists "applicants read own broker app" on public.broker_applications;
create policy "applicants read own broker app" on public.broker_applications
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null, email text not null, phone text,
  bank_name text not null, card_limit numeric, card_age_years numeric,
  utilization_pct numeric, notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  status_reason text, created_at timestamptz not null default now(), reviewed_at timestamptz
);
grant select, insert on public.seller_applications to anon, authenticated;
grant all on public.seller_applications to service_role;
alter table public.seller_applications enable row level security;
drop policy if exists "anyone can apply as seller" on public.seller_applications;
create policy "anyone can apply as seller" on public.seller_applications
  for insert to anon, authenticated with check (true);
drop policy if exists "applicants read own seller app" on public.seller_applications;
create policy "applicants read own seller app" on public.seller_applications
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

drop policy if exists "admins manage all orders" on public.orders;
create policy "admins manage all orders" on public.orders
  for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

drop policy if exists "admins manage broker apps" on public.broker_applications;
create policy "admins manage broker apps" on public.broker_applications
  for update to authenticated using (public.has_role(auth.uid(),'admin'));

drop policy if exists "admins manage seller apps" on public.seller_applications;
create policy "admins manage seller apps" on public.seller_applications
  for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- After running, bootstrap yourself as admin (replace the email):
-- insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com'
--   on conflict do nothing;
