import 'server-only'

import { canGuestUpload } from '@/lib/access'
import { isUuid } from '@/lib/events'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GuestSummary } from '@/types/database'

/**
 * Daftar tamu sebuah acara, lengkap dengan jumlah foto masing-masing.
 *
 * Bentuk kembaliannya sengaja `GuestSummary`, bukan baris mentah: `device_id`
 * adalah identitas perangkat, dan daftar ini ikut ditampilkan ke sesama tamu.
 * Menyaringnya di sini, bukan di komponen, membuat kebocoran tidak mungkin
 * terjadi karena satu komponen lupa memilih kolom.
 */
export async function getEventGuests(eventId: string): Promise<GuestSummary[]> {
  if (!isUuid(eventId)) return []

  const admin = createAdminClient()

  // `select('*')` karena can_upload belum ada sebelum migration 0003, dan
  // menyebutnya eksplisit akan menggagalkan seluruh query.
  const [{ data: guests, error }, { data: photos }] = await Promise.all([
    admin.from('guests').select('*').eq('event_id', eventId).order('joined_at'),
    admin.from('photos').select('guest_id').eq('event_id', eventId).eq('is_deleted', false),
  ])

  if (error) {
    console.error(`[rol] getEventGuests(${eventId}) gagal:`, error.message)
    return []
  }

  const photoCounts = new Map<string, number>()
  for (const photo of photos ?? []) {
    photoCounts.set(photo.guest_id, (photoCounts.get(photo.guest_id) ?? 0) + 1)
  }

  return (guests ?? []).map((guest) => ({
    id: guest.id,
    name: guest.name,
    joinedAt: guest.joined_at,
    canUpload: canGuestUpload(guest),
    photoCount: photoCounts.get(guest.id) ?? 0,
  }))
}
