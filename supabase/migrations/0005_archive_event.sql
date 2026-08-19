-- ============================================================================
-- Migration 0005: arsipkan acara, lalu hapus permanen dari arsip
--
-- Dua tahap, bukan satu tombol hapus, karena taruhannya asimetris. Kalau host
-- salah tekan, yang hilang bukan konfigurasi yang bisa dibuat ulang, melainkan
-- foto acara yang mungkin belum sempat diunduh siapa pun. Biaya menahan sebentar
-- hampir nol; biaya salah hapus tidak bisa dikembalikan.
--
-- Tahap 1 (kolom ini): arsipkan. Album tertutup untuk tamu dan acaranya hilang
-- dari daftar utama host, tapi tidak ada satu baris pun yang dihapus.
--
-- Tahap 2 tidak butuh kolom: penghapusan permanen memakai DELETE biasa, yang
-- sudah dirambatkan ke guests dan photos lewat on delete cascade dari migration
-- 0001. Yang TIDAK dirambatkan adalah file di storage, jadi aplikasi harus
-- membersihkannya lebih dulu; kalau tidak, filenya jadi yatim, memakan kuota
-- selamanya tanpa ada lagi yang tahu milik siapa.
-- ============================================================================

alter table public.events
  add column if not exists archived_at timestamptz;

comment on column public.events.archived_at is
  'NULL = aktif. Terisi = diarsipkan; tamu kehilangan akses, host masih bisa mengembalikan.';

-- Daftar acara aktif adalah query yang paling sering dijalankan host.
create index if not exists events_active_idx
  on public.events (host_user_id, created_at desc) where archived_at is null;
