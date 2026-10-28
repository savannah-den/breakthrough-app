-- Breakthrough app database. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run again: it only creates things that don't exist yet.

-- 1. Who each person is ---------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text default '',
  tier text not null default 'self_paced' check (tier in ('self_paced','private')),
  is_admin boolean not null default false,
  program_start date,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- 2. Everything a client saves in the app (one row per saved tool) --------
create table if not exists public.client_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- 3. Your private notes about each client (clients never see these) -------
create table if not exists public.coach_notes (
  id bigint generated always as identity primary key,
  client_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- 4. People you've pre-approved (e.g. private clients) before they log in --
create table if not exists public.invites (
  email text primary key,
  tier text not null default 'private' check (tier in ('self_paced','private')),
  full_name text default '',
  created_at timestamptz not null default now()
);

-- 5. App-wide settings you edit from the admin page (video links etc.) -----
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Helper: is the logged-in person you? ------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- When someone logs in for the first time, make their profile ------------
-- >>> CHANGE THE EMAIL BELOW if your admin login email is different <<<
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invites%rowtype;
begin
  select * into inv from public.invites where lower(email) = lower(new.email);
  insert into public.profiles (id, email, full_name, tier, is_admin, program_start)
  values (
    new.id, new.email, coalesce(inv.full_name, ''),
    coalesce(inv.tier, 'self_paced'),
    lower(new.email) in ('savannah@savannahdenny.com.au'),
    current_date
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients can stamp "last seen" on themselves but nothing else -----------
create or replace function public.touch_last_seen() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

-- Security rules: each client sees only their own stuff; you see everything
alter table public.profiles enable row level security;
alter table public.client_data enable row level security;
alter table public.coach_notes enable row level security;
alter table public.invites enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "own profile or admin" on public.profiles;
create policy "own profile or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admin edits profiles" on public.profiles;
create policy "admin edits profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read own data or admin" on public.client_data;
create policy "read own data or admin" on public.client_data for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "write own data" on public.client_data;
create policy "write own data" on public.client_data for insert with check (user_id = auth.uid());
drop policy if exists "update own data" on public.client_data;
create policy "update own data" on public.client_data for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete own data" on public.client_data;
create policy "delete own data" on public.client_data for delete using (user_id = auth.uid());

drop policy if exists "admin only notes" on public.coach_notes;
create policy "admin only notes" on public.coach_notes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin only invites" on public.invites;
create policy "admin only invites" on public.invites for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "everyone logged in reads settings" on public.app_settings;
create policy "everyone logged in reads settings" on public.app_settings for select using (auth.role() = 'authenticated');
drop policy if exists "admin writes settings" on public.app_settings;
create policy "admin writes settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

grant execute on function public.touch_last_seen() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Clients can change their own name from their profile (nothing else on their profile row)
create or replace function public.update_my_profile(new_name text) returns void
language sql security definer set search_path = public as $$
  update public.profiles set full_name = left(trim(new_name), 120) where id = auth.uid();
$$;
grant execute on function public.update_my_profile(text) to authenticated;

-- Coaching agreements: Sav sets the package (terms) per client; the client reads it and signs in the app.
-- Clients can only read their own row and sign it through sign_my_contract (they can't change the terms).
create table if not exists public.contracts (
  user_id uuid primary key references auth.users on delete cascade,
  terms jsonb not null default '{}'::jsonb,
  status text not null default 'draft',          -- draft | sent | signed
  signed jsonb,                                   -- { client: {...her details, consent, signedName...}, terms: {...exact terms she signed} }
  signed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.contracts enable row level security;
drop policy if exists "read own contract or admin" on public.contracts;
create policy "read own contract or admin" on public.contracts for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin manages contracts" on public.contracts;
create policy "admin manages contracts" on public.contracts for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.sign_my_contract(sig jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  update public.contracts
     set signed = jsonb_build_object('client', sig, 'terms', terms), signed_at = t, status = 'signed', updated_at = t
   where user_id = auth.uid() and status = 'sent';
  if not found then raise exception 'No agreement waiting to be signed'; end if;
  return t;
end $$;
grant execute on function public.sign_my_contract(jsonb) to authenticated;

-- Coach-only notes about each client (only Sav can see or change these):
-- her own photo of them, Human Design / DISC screenshots + notes, and 1:1 session records
-- (Zoom AI summary, transcript, Google Drive video link, her notes).
create table if not exists public.coach_clients (
  client_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.coach_clients enable row level security;
drop policy if exists "admin only coach_clients" on public.coach_clients;
create policy "admin only coach_clients" on public.coach_clients for all using (public.is_admin()) with check (public.is_admin());

-- Phone notifications: one row per phone/browser that said yes to notifications.
-- Clients pick a reminder hour (in their own timezone); Sav's rows get a ping for new wins and signed agreements.
create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sub jsonb not null,
  tz text,
  remind_hour int,
  updated_at timestamptz default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "own push subs" on public.push_subs;
create policy "own push subs" on public.push_subs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
