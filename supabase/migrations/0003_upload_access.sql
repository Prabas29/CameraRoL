-- ============================================================================
-- Migration 0003: daftar tamu terbuka + kendali siapa yang boleh mengunggah
--
-- Dua kebutuhan yang saling terkait:
--   1. Tamu ingin tahu siapa saja yang sudah bergabung.
--   2. Host ingin menentukan siapa yang boleh mengunggah foto. Link acara
--      gampang tersebar ke luar undangan, dan tanpa kendali ini siapa pun yang
--      memegang link bisa mengisi album.
--
-- `upload_policy` menentukan hak tamu BARU:
--   open     : langsung boleh mengunggah (perilaku lama, tetap jadi default)
--   approval : bergabung dulu, menunggu host mengizinkan
--
-- Dibuat text + check, bukan enum, supaya menambah mode ketiga nanti cukup
-- mengubah constraint tanpa ALTER TYPE yang mengunci tabel.
--
-- Keduanya punya default, jadi baris lama tetap sah: tamu yang sudah ada tetap
-- boleh mengunggah dan acara yang sudah ada tetap terbuka.
-- ============================================================================

alter table public.events
  add column if not exists upload_policy text not null default 'open';

do $$ begin
  alter table public.events
    add constraint events_upload_policy_check
    check (upload_policy in ('open', 'approval'));
exception when duplicate_object then null;
end $$;

alter table public.guests
  add column if not exists can_upload boolean not null default true;

comment on column public.events.upload_policy is
  'Hak unggah untuk tamu BARU. open = langsung boleh, approval = menunggu izin host.';

comment on column public.guests.can_upload is
  'Ditegakkan di route handler upload, bukan hanya disembunyikan di UI.';

-- Host sering membuka daftar tamu diurutkan waktu gabung.
create index if not exists guests_event_joined_idx
  on public.guests (event_id, joined_at);

-- ---------------------------------------------------------------------------
-- RLS: host perlu bisa MENGUBAH hak unggah tamu di acaranya.
--
-- Tanpa policy ini, UPDATE dari sesi host tidak error, tapi juga tidak mengubah
-- apa pun: RLS menyaring barisnya lebih dulu sehingga PostgREST membalas sukses
-- untuk nol baris. Kegagalan diam seperti itu yang paling lama dicari.
-- ---------------------------------------------------------------------------
drop policy if exists "host_updates_own_event_guests" on public.guests;
create policy "host_updates_own_event_guests"
  on public.guests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id
        and e.host_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id
        and e.host_user_id = auth.uid()
    )
  );
