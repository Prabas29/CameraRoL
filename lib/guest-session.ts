import 'server-only'

import { cookies } from 'next/headers'

import { createAdminClient } from '@/lib/supabase/admin'
import type { GuestRow } from '@/types/database'

/**
 * Identitas tamu disimpan di cookie httpOnly per event, berisi id baris `guests`.
 *
 * Cookie-nya httpOnly supaya tidak bisa dibaca/ditulis JavaScript di halaman.
 * Ini bukan mekanisme anti-pemalsuan — siapa pun memang boleh jadi tamu — tapi
 * membuat server punya satu sumber identitas yang konsisten untuk mengaitkan
 * foto ke nama, tanpa mempercayai apa pun yang dikirim dari browser.
 */
export const guestCookieName = (eventId: string) => `rol_g_${eventId}`

export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 60 // 60 hari

export const guestCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: GUEST_COOKIE_MAX_AGE,
}

/**
 * Mengembalikan baris guest untuk event ini, atau null kalau cookie tidak ada /
 * sudah tidak cocok (mis. event dihapus lalu dibuat ulang).
 */
export async function getGuest(eventId: string): Promise<GuestRow | null> {
  const cookieStore = await cookies()
  const guestId = cookieStore.get(guestCookieName(eventId))?.value
  if (!guestId) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .eq('event_id', eventId)
    .maybeSingle()

  return data ?? null
}
