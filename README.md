# Rol

Kamera sekali pakai versi digital untuk acara. Host membuat event dan membagikan
satu QR; tamu memotret lewat browser tanpa instal aplikasi dan tanpa login; semua
foto terkunci sampai waktu reveal, lalu terbuka serentak jadi satu album bersama.

Prototype/MVP — fokusnya membuktikan alur end-to-end.

## Stack

- Next.js 15 (App Router, TypeScript)
- Supabase — Postgres + Storage. Auth hanya untuk host (magic link)
- Tailwind CSS v4 + shadcn/ui
- Deploy target: Vercel

## Model keamanan: server-gated

Ini keputusan arsitektur paling menentukan di project ini, jadi penting dipahami
sebelum mengubah kode:

- **Tamu tidak pernah memegang key Supabase.** Semua aksi tamu — join, upload
  foto, membaca gallery — lewat route handler Next.js yang memakai
  `service_role`, dan route handler itulah yang menegakkan aturan reveal.
- **Role `anon` sengaja tidak diberi policy sama sekali.** RLS aktif dengan nol
  policy berarti tolak semua. Ini yang membuat foto benar-benar tidak bisa
  diintip sebelum reveal, termasuk lewat devtools.
- **Bucket storage privat.** Foto hanya sampai ke browser sebagai signed URL
  yang diterbitkan server, dan hanya setelah pengecekan reveal lolos.
- **Host memakai RLS biasa** (`auth.uid() = host_user_id`) karena dia memang
  punya sesi Supabase.

Konsekuensinya: `SUPABASE_SERVICE_ROLE_KEY` tidak boleh bocor ke bundle client.
`lib/supabase/admin.ts` mengimpor `server-only` supaya build gagal kalau file itu
tidak sengaja terseret ke sisi client.

## Setup

### 1. Buat project Supabase

Buat project baru di [supabase.com](https://supabase.com).

### 2. Jalankan migration

Buka **SQL Editor** di dashboard Supabase, paste seluruh isi
`supabase/migrations/0001_init.sql`, lalu Run. Ini membuat tabel, enum, RLS
policy, dan bucket storage privat `rol-photos`.

Kalau pakai Supabase CLI: `supabase db push`.

### 3. Isi environment variables

```bash
cp .env.local.example .env.local
```

Isi nilainya dari **Project Settings → API** di dashboard Supabase:

| Variabel | Dari mana | Catatan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key | aman di browser |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **rahasia**, server saja |
| `NEXT_PUBLIC_SITE_URL` | — | `http://localhost:3000` saat dev |

### 4. Atur redirect URL magic link

Di dashboard Supabase → **Authentication → URL Configuration**, tambahkan ke
*Redirect URLs*:

```
http://localhost:3000/auth/callback
https://<domain-produksimu>/auth/callback
```

Tanpa ini, link masuk yang diklik host akan ditolak.

### 5. Jalankan

```bash
npm run dev
```

## Penting: kamera butuh HTTPS

`navigator.mediaDevices.getUserMedia` hanya tersedia di *secure context*. Artinya
halaman kamera berfungsi di:

- `http://localhost:3000` — aman, localhost dianggap secure
- domain HTTPS mana pun (mis. Vercel preview/production)

Dan **tidak** berfungsi kalau kamu membuka dev server dari HP lewat IP LAN
(`http://192.168.x.x:3000`). Untuk uji coba dari HP, pilih salah satu:

- deploy ke Vercel dan tes dari preview URL, atau
- `next dev --experimental-https` lalu percayai sertifikatnya di HP

## Deploy ke Vercel

Halaman kamera butuh HTTPS, jadi ini satu-satunya cara menguji dari HP dengan
andal.

### 1. Login & deploy pertama

```bash
npx vercel login      # interaktif, buka browser
npx vercel            # deploy preview + bikin project
```

### 2. Isi environment variables

Tiga variabel, semuanya untuk ketiga environment:

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Jangan** menambahkan `NEXT_PUBLIC_SITE_URL` di Vercel. `siteUrl()` di
`lib/env.ts` sudah mendeteksi sendiri: deployment produksi memakai domain
produksi yang stabil, deployment preview memakai URL preview-nya sendiri. Kalau
variabel ini di-set, ia menang atas keduanya dan QR di preview akan menunjuk ke
produksi. Set hanya bila kamu memakai custom domain.

### 3. Daftarkan redirect URL magic link di Supabase

**Authentication → URL Configuration → Redirect URLs**:

```
http://localhost:3000/auth/callback
https://<domain-produksi>/auth/callback
https://<nama-project>-*.vercel.app/auth/callback
```

Baris ketiga memakai wildcard supaya login host tetap jalan di deployment
preview, yang URL-nya berubah tiap push.

### 4. Naikkan ke produksi

```bash
npx vercel --prod
```

Setelah itu buat event baru dari domain produksi — QR-nya akan berisi URL
produksi, dan bisa discan langsung dari HP.

## Struktur

```
app/
  page.tsx                  landing
  login/                    magic link host
  auth/callback/            tukar kode OTP jadi sesi
  dashboard/                area host (dijaga middleware)
    actions.ts              server action: create/reveal/ganti style/hapus foto
    new/                    form buat acara
    [eventId]/              detail: QR, statistik, kontrol, moderasi foto
  e/[eventId]/              area tamu
    page.tsx                join — isi nama
    camera/                 live preview + shutter + upload
    locked/                 countdown menunggu reveal
    gallery/                album terbuka + lightbox + unduh
  api/events/[eventId]/     route handler ber-service_role untuk aksi tamu
    join/                   daftar tamu, set cookie httpOnly
    photos/                 terima 2 file (mentah + filtered)
components/                 komponen aplikasi + components/ui dari shadcn
lib/
  film-styles.ts            sumber kebenaran tunggal untuk look film
  reveal.ts                 satu definisi "event sudah terbuka"
  bake-photo.ts             capture + bake filter di canvas (client)
  gallery.ts                ambil foto + signed URL, digerbangi reveal
  photos.ts                 penerbitan signed URL (server-only)
  guest-session.ts          identitas tamu lewat cookie httpOnly
  supabase/                 client browser / server / admin
types/database.ts           tipe skema
supabase/migrations/        SQL
```

## Alur tamu

```
/e/<id>            isi nama  ──► POST /api/events/<id>/join
                                 upsert guests, set cookie httpOnly
       │
       ▼
/e/<id>/camera     getUserMedia ─► shutter ─► bake di canvas
                                 POST /api/events/<id>/photos (2 file JPEG)
                                 balasan TIDAK berisi URL foto
       │
       ▼  klik "Album"
/e/<id>/gallery    isRevealed(event)?
                     tidak ─► redirect /e/<id>/locked  (countdown)
                     ya    ─► terbitkan signed URL, tampilkan grid
```

Perlu dicatat: `getRevealedPhotos()` mengembalikan array kosong selama event
belum terbuka, jadi saat terkunci tidak ada satu pun signed URL yang pernah
sampai ke HTML — bukan sekadar disembunyikan lewat CSS.

ZIP "Unduh semua" dirakit di browser dengan JSZip. Signed URL Supabase mengirim
`Access-Control-Allow-Origin: *` sehingga file bisa diambil langsung dari client,
dan album besar tidak perlu melewati batas memori/waktu fungsi serverless.

## Film style

`lib/film-styles.ts` memegang satu `cssFilter` per style yang dipakai apa adanya
di dua tempat: sebagai CSS `filter` untuk live preview di halaman kamera, dan
sebagai Canvas `ctx.filter` saat mem-*bake* foto sebelum upload. Karena
sintaksnya identik, preview dan hasil akhir tidak bisa melenceng.

Tiap foto disimpan dua kali: versi mentah tanpa filter, dan versi yang filternya
sudah di-bake. Mengganti film style event hanya memengaruhi foto berikutnya.

> **TODO** — agar ganti style ikut mengubah foto lama, perlu proses render ulang
> dari file mentah (job batch atau transform on-the-fly). Belum ada di MVP ini.

## Yang belum ada di MVP

Payment/tier, App Clip & native app, offline capture & sync, multi-bahasa, dan
gallery privat per tamu sebelum reveal — semuanya sengaja di luar scope.
