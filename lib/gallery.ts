import 'server-only'

import { signPhotoUrls } from '@/lib/photos'
import { isRevealed } from '@/lib/reveal'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GalleryPhoto, PublicEventLike } from '@/types/database'

/** Nama file yang enak dibaca saat foto diunduh atau dibuka dari dalam ZIP. */
function photoFilename(guestName: string, createdAt: string, index: number): string {
  const slug =
    guestName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'guest'

  const stamp = new Date(createdAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `${String(index + 1).padStart(3, '0')}-${slug}-${stamp}.jpg`
}

/**
 * Mengambil seluruh foto sebuah event beserta signed URL-nya.
 *
 * Gerbang reveal ada DI SINI, bukan di komponen. Selama `isRevealed()` bernilai
 * false fungsi ini mengembalikan array kosong dan tidak pernah menerbitkan satu
 * pun signed URL — jadi tidak ada jalan bagi tamu untuk mendapatkan alamat foto
 * sebelum waktunya, seberapa pun kreatif mereka mengutak-atik client.
 */
export async function getRevealedPhotos(
  event: PublicEventLike,
  fallbackGuestName = 'Tamu',
): Promise<GalleryPhoto[]> {
  if (!isRevealed(event)) return []

  const admin = createAdminClient()

  // `select('*')` bukan daftar kolom eksplisit: kalau migration 0002 belum
  // dijalankan, menyebut thumb_storage_path secara eksplisit akan membuat
  // seluruh query gagal. Dengan '*' kolom itu sekadar tidak ada.
  const { data: rows, error: photosError } = await admin
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (photosError) {
    console.error(`[rol] getRevealedPhotos(${event.id}) gagal:`, photosError.message, photosError)
    return []
  }

  if (!rows || rows.length === 0) return []

  const { data: guests, error: guestsError } = await admin
    .from('guests')
    .select('id, name')
    .eq('event_id', event.id)

  if (guestsError) {
    // Bukan alasan menggagalkan gallery — foto tetap tampil, namanya saja yang
    // jatuh ke default "Tamu".
    console.error(`[rol] gagal membaca nama tamu (${event.id}):`, guestsError.message)
  }

  const guestNames = new Map((guests ?? []).map((guest) => [guest.id, guest.name]))

  // Tandatangani versi penuh dan thumbnail dalam satu panggilan.
  const pathsToSign = rows.flatMap((row) =>
    row.thumb_storage_path
      ? [row.filtered_storage_path, row.thumb_storage_path]
      : [row.filtered_storage_path],
  )
  const signedUrls = await signPhotoUrls(pathsToSign)

  return rows.flatMap((row, index) => {
    const url = signedUrls.get(row.filtered_storage_path)
    if (!url) return []

    const guestName = guestNames.get(row.guest_id) ?? fallbackGuestName
    return [
      {
        id: row.id,
        guestName,
        createdAt: row.created_at,
        url,
        // Foto lama belum punya thumbnail — pakai versi penuh supaya tetap tampil.
        thumbUrl: (row.thumb_storage_path && signedUrls.get(row.thumb_storage_path)) || url,
        filename: photoFilename(guestName, row.created_at, index),
      },
    ]
  })
}
