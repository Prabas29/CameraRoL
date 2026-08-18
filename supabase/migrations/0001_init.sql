-- ============================================================================
-- Rol, disposable camera digital untuk event
-- Migration 0001: schema awal, RLS, storage bucket
-- ----------------------------------------------------------------------------
-- Cara pakai (pilih salah satu):
--   A. Supabase Dashboard → SQL Editor → paste seluruh file ini → Run
--   B. Supabase CLI → `supabase db push`
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.film_style as enum ('vintage', 'original', 'bw');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.reveal_mode as enum ('scheduled', 'manual');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tabel
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  host_user_id  uuid not null references auth.users (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 80),
  film_style    public.film_style not null default 'original',
  reveal_mode   public.reveal_mode not null default 'scheduled',
  reveal_at     timestamptz,
  is_revealed   boolean not null default false,
  created_at    timestamptz not null default now(),

  -- mode 'scheduled' wajib punya waktu reveal; mode 'manual' tidak perlu
  constraint events_reveal_at_check check (
    (reveal_mode = 'scheduled' and reveal_at is not null)
    or (reveal_mode = 'manual')
  )
);

create index if not exists events_host_user_id_idx
  on public.events (host_user_id, created_at desc);

create table if not exists public.guests (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  device_id  uuid not null,
  name       text not null check (char_length(trim(name)) between 1 and 40),
  joined_at  timestamptz not null default now(),

  -- satu device = satu identitas per event (rejoin akan meng-update nama)
  unique (event_id, device_id)
);

create index if not exists guests_event_id_idx on public.guests (event_id);

create table if not exists public.photos (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  guest_id              uuid not null references public.guests (id) on delete cascade,
  -- foto mentah tanpa filter, sumber kebenaran, dipakai kalau nanti mau re-render
  storage_path          text not null,
  -- foto yang filter-nya sudah di-"bake" saat capture, dipakai untuk display
  filtered_storage_path text not null,
  film_style_applied    public.film_style not null,
  is_deleted            boolean not null default false,
  created_at            timestamptz not null default now()
);

create index if not exists photos_event_id_idx
  on public.photos (event_id, created_at desc) where is_deleted = false;

create index if not exists photos_guest_id_idx on public.photos (guest_id);

-- ---------------------------------------------------------------------------
-- 3. Helper: apakah event sudah terbuka?
--    Dipakai oleh server (route handler) maupun policy.
-- ---------------------------------------------------------------------------
create or replace function public.event_is_revealed(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    e.is_revealed or (e.reveal_at is not null and e.reveal_at <= now()),
    false
  )
  from public.events e
  where e.id = p_event_id;
$$;

-- ---------------------------------------------------------------------------
-- 4. View statistik untuk dashboard host
-- ---------------------------------------------------------------------------
create or replace view public.event_stats as
select
  e.id as event_id,
  (select count(*) from public.guests g where g.event_id = e.id) as guest_count,
  (select count(*) from public.photos p
     where p.event_id = e.id and p.is_deleted = false)          as photo_count
from public.events e;

-- security_invoker: view ikut RLS pemanggil, bukan pemilik view.
-- Tanpa ini, host bisa membaca statistik event milik orang lain.
alter view public.event_stats set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
--
--    Model keamanan aplikasi ini adalah "server-gated":
--      - Guest TIDAK PERNAH memegang key Supabase. Semua aksi guest
--        (join, upload foto, baca gallery) lewat route handler Next.js yang
--        memakai service_role, dan service_role melewati RLS.
--      - Karena itu role `anon` sengaja TIDAK diberi policy sama sekali.
--        RLS aktif + nol policy = tolak semua. Ini yang menjamin foto tidak
--        bisa diintip sebelum reveal, bahkan lewat devtools.
--      - Role `authenticated` (host) hanya bisa menyentuh event miliknya.
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.photos enable row level security;

-- Host: full CRUD atas event miliknya sendiri
drop policy if exists "host_manages_own_events" on public.events;
create policy "host_manages_own_events"
  on public.events
  for all
  to authenticated
  using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

-- Host: baca daftar guest di event miliknya (read-only, guest dibuat server)
drop policy if exists "host_reads_own_event_guests" on public.guests;
create policy "host_reads_own_event_guests"
  on public.guests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id
        and e.host_user_id = auth.uid()
    )
  );

-- Host: baca foto di event miliknya (termasuk sebelum reveal, ini event dia)
drop policy if exists "host_reads_own_event_photos" on public.photos;
create policy "host_reads_own_event_photos"
  on public.photos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id
        and e.host_user_id = auth.uid()
    )
  );

-- Host: soft delete foto (moderasi). Hanya kolom is_deleted yang relevan;
-- pembatasan kolom ditegakkan di layer aplikasi.
drop policy if exists "host_updates_own_event_photos" on public.photos;
create policy "host_updates_own_event_photos"
  on public.photos
  for update
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id
        and e.host_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id
        and e.host_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Storage
--    Bucket privat. Tidak ada policy untuk anon/authenticated, jadi hanya
--    service_role yang bisa menulis/membaca. URL foto diterbitkan server
--    sebagai signed URL, dan hanya setelah cek reveal lolos.
--
--    Struktur path:  <event_id>/original/<photo_id>.jpg
--                    <event_id>/filtered/<photo_id>.jpg
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rol-photos',
  'rol-photos',
  false,
  10485760,                      -- 10 MB per file
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
