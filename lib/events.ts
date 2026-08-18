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
  if (!isUuid(eventId)) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('events')
    .select('id, name, film_style, reveal_mode, reveal_at, is_revealed')
    .eq('id', eventId)
    .maybeSingle()

  return data ?? null
}
