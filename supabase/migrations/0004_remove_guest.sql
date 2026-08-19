-- ============================================================================
-- Migration 0004: host bisa mengeluarkan tamu yang tidak dikenal
--
-- Sengaja BUKAN delete baris. `photos.guest_id` punya on delete cascade, jadi
-- menghapus tamu ikut menghapus permanen seluruh fotonya. Host mengeluarkan
-- orang berdasarkan tebakan "saya tidak kenal ini siapa", dan tebakan bisa
-- meleset: yang dikira penyusup ternyata sepupu yang memakai nama panggilan.
-- Karena itu dibuat sebagai status yang bisa dibatalkan.
--
-- Baris tamu juga harus tetap ada supaya perangkat yang sama tidak bisa
-- bergabung lagi sebagai orang baru dengan sekadar membuka link sekali lagi.
--
-- `hidden_by_removal` memisahkan foto yang disembunyikan OLEH pengeluaran dari
-- foto yang sebelumnya sudah dihapus host satu per satu. Tanpa pemisahan itu,
-- membatalkan pengeluaran akan ikut menghidupkan kembali foto yang memang
-- sengaja dihapus.
-- ============================================================================

alter table public.guests
  add column if not exists removed_at timestamptz;

alter table public.photos
  add column if not exists hidden_by_removal boolean not null default false;

comment on column public.guests.removed_at is
  'NULL = tamu aktif. Terisi = dikeluarkan host; ditegakkan di route upload.';

comment on column public.photos.hidden_by_removal is
  'true hanya untuk foto yang disembunyikan karena tamunya dikeluarkan, supaya pembatalan tidak menghidupkan foto yang dihapus host satu per satu.';

-- Daftar tamu aktif adalah query yang paling sering dijalankan.
create index if not exists guests_active_idx
  on public.guests (event_id, joined_at) where removed_at is null;
