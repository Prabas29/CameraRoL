/**
 * Pembacaan environment variable terpusat, biar kalau ada yang lupa diisi
 * error-nya jelas menyebut nama variabelnya, bukan "undefined is not a string"
 * dari dalam library.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Environment variable ${name} belum diisi. Salin .env.local.example jadi .env.local lalu lengkapi nilainya.`,
    )
  }

  // URL dan API key tidak pernah sah punya spasi/newline di ujung, sementara
  // paste ke dashboard Vercel gampang sekali membawa satu karakter nyasar.
  // Dipangkas, tapi tetap diberi peringatan supaya salah paste ketahuan dan
  // bukan disembunyikan diam-diam.
  const trimmed = value.trim()
  if (trimmed !== value) {
    console.warn(
      `[rol] Environment variable ${name} punya spasi/newline di ujungnya — ` +
        `dipangkas otomatis. Sebaiknya dirapikan di sumbernya juga.`,
    )
  }

  if (!trimmed) {
    throw new Error(`Environment variable ${name} hanya berisi spasi.`)
  }

  return trimmed
}

/** Aman dipakai di browser. */
export const publicEnv = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  },
}

/** HANYA server. Jangan diimpor dari komponen client. */
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
  },
}

/**
 * Base URL aplikasi, untuk membangun link undangan/QR dan redirect magic link.
 *
 * Urutannya penting. QR code yang tercetak menunjuk ke URL ini, jadi salah
 * pilih berarti tamu diarahkan ke deployment yang salah:
 *
 *   1. NEXT_PUBLIC_SITE_URL — dipakai kalau di-set eksplisit (dev, custom domain)
 *   2. Produksi Vercel      — domain produksi yang stabil, bukan URL deployment
 *                             yang berubah tiap kali push
 *   3. Preview Vercel       — URL deployment itu sendiri, supaya QR di preview
 *                             mengarah ke preview yang sedang diuji
 *   4. localhost
 *
 * Karena itu di Vercel sebaiknya NEXT_PUBLIC_SITE_URL TIDAK di-set, kecuali
 * kamu memakai custom domain.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  const deployment = process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL
  if (deployment) return `https://${deployment}`

  return 'http://localhost:3000'
}

export const STORAGE_BUCKET = 'rol-photos'
