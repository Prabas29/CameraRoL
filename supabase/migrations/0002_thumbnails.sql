-- ============================================================================
-- Migration 0002: thumbnail terpisah untuk grid gallery
--
-- Masalahnya: grid gallery memuat file "filtered" ukuran penuh (~550 KB) lalu
-- mengecilkannya jadi kotak kecil lewat CSS. Album 100 foto berarti ~55 MB
-- terunduh hanya untuk menampilkan petak-petak kecil.
--
-- Solusinya menambah versi kecil yang dibuat di browser saat capture. Versi
-- penuh dan file mentah tidak disentuh sama sekali — lightbox dan unduhan
-- tetap memakai kualitas asli.
--
-- Nullable karena foto yang sudah terlanjur ada tidak punya thumbnail;
-- aplikasi jatuh ke versi penuh untuk baris-baris itu.
-- ============================================================================

alter table public.photos
  add column if not exists thumb_storage_path text;

comment on column public.photos.thumb_storage_path is
  'Versi kecil untuk grid. NULL untuk foto sebelum migration 0002 — pemanggil harus jatuh ke filtered_storage_path.';
