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

  if (error || !data) return result

  for (const entry of data) {
    if (entry.signedUrl && entry.path) {
      result.set(entry.path, entry.signedUrl)
    }
  }

  return result
}
