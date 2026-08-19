import 'server-only'

import { STORAGE_BUCKET } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

/** Berapa lama signed URL berlaku. Cukup lama untuk sesi lihat-lihat gallery. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60

export function originalPath(eventId: string, photoId: string) {
  return `${eventId}/original/${photoId}.jpg`
}

export function filteredPath(eventId: string, photoId: string) {
  return `${eventId}/filtered/${photoId}.jpg`
}

export function thumbPath(eventId: string, photoId: string) {
  return `${eventId}/thumb/${photoId}.jpg`
}

/**
 * Menukar path storage jadi signed URL.
 *
 * Bucket-nya privat dan tidak punya policy untuk anon, jadi ini satu-satunya
 * cara foto bisa sampai ke browser. Pemanggil WAJIB sudah memastikan event
 * boleh dibuka sebelum memanggil fungsi ini.
 */
export async function signPhotoUrls(
  paths: string[],
  expiresIn: number = SIGNED_URL_TTL_SECONDS,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (paths.length === 0) return result

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(paths, expiresIn)

  if (error || !data) {
    console.error('[rol] signPhotoUrls gagal:', error?.message ?? 'tanpa data', error)
    return result
  }

  for (const entry of data) {
    if (entry.signedUrl && entry.path) {
      result.set(entry.path, entry.signedUrl)
    }
  }

  return result
}

/**
 * Menghapus seluruh file milik sebuah acara dari storage.
 *
 * Dipanggil SEBELUM barisnya dihapus. Cascade di database tidak menyentuh
 * storage sama sekali, jadi menghapus baris lebih dulu berarti kehilangan
 * satu-satunya petunjuk file mana milik siapa, dan file itu akan memakan kuota
 * selamanya tanpa bisa ditelusuri lagi.
 *
 * Yang didaftar adalah isi foldernya, bukan path yang diturunkan dari baris
 * photos, supaya sisa unggahan yang gagal di tengah jalan ikut terbawa bersih.
 */
export async function removeEventFiles(eventId: string): Promise<number> {
  const admin = createAdminClient()
  const bucket = admin.storage.from(STORAGE_BUCKET)
  const paths: string[] = []

  for (const folder of ['original', 'filtered', 'thumb']) {
    const { data, error } = await bucket.list(`${eventId}/${folder}`, { limit: 1000 })
    if (error) {
      console.error(`[rol] gagal mendaftar ${eventId}/${folder}:`, error.message)
      continue
    }
    for (const file of data ?? []) paths.push(`${eventId}/${folder}/${file.name}`)
  }

  if (paths.length === 0) return 0

  const { error } = await bucket.remove(paths)
  if (error) {
    console.error(`[rol] gagal menghapus file ${eventId}:`, error.message)
    return 0
  }

  return paths.length
}
