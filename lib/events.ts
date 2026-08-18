import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { EventRow } from '@/types/database'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

/** Bagian event yang boleh dilihat tamu. Sengaja tanpa `host_user_id`. */
export type PublicEvent = Pick<
  EventRow,
  'id' | 'name' | 'film_style' | 'reveal_mode' | 'reveal_at' | 'is_revealed'
>

/**
 * Mengambil event untuk halaman tamu.
 *
 * Tamu tidak punya key Supabase, jadi pembacaan ini harus lewat service_role di
 * server. Kolom yang diambil dibatasi agar tidak ada data host yang bocor ke
 * payload halaman.
 */
export async function getPublicEvent(eventId: string): Promise<PublicEvent | null> {
  if (!isUuid(eventId)) {
    console.warn(`[rol] getPublicEvent: "${eventId}" bukan UUID yang valid`)
    return null
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('events')
    .select('id, name, film_style, reveal_mode, reveal_at, is_revealed')
    .eq('id', eventId)
    .maybeSingle()

  if (error) {
    console.error(`[rol] getPublicEvent(${eventId}) gagal:`, error.message, error)
    return null
  }

  if (!data) {
    // Nol baris TANPA error hampir selalu berarti query dijalankan sebagai anon,
    // bukan service_role: RLS memblokir semuanya dan PostgREST membalas 200 []
    // dengan tenang. Karena itu pesan ini menyebut dugaannya secara eksplisit —
    // kalau tidak, gejalanya tidak bisa dibedakan dari event yang memang tidak ada.
    console.warn(
      `[rol] getPublicEvent(${eventId}): nol baris tanpa error. ` +
        `Kalau event ini yakin ada, periksa SUPABASE_SERVICE_ROLE_KEY — ` +
        `nilainya harus key "sb_secret_..." (service_role), bukan "sb_publishable_..." (anon). ` +
        `Key anon akan selalu mengembalikan nol baris karena RLS.`,
    )
    return null
  }

  return data
}
