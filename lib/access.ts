import type { EventRow, GuestRow, UploadPolicy } from '@/types/database'

/**
 * Satu-satunya tempat yang memutuskan boleh-tidaknya seorang tamu mengunggah.
 *
 * Dipakai server (gerbang sebenarnya, di route handler upload) dan client
 * (hanya untuk menonaktifkan tombol). Client tidak dipercaya: menonaktifkan
 * tombol shutter cuma menghemat satu percobaan yang pasti gagal.
 *
 * `can_upload` bisa undefined kalau migration 0003 belum dijalankan. Dalam
 * kondisi itu jawabannya "boleh", supaya menunda migration tidak diam-diam
 * membungkam semua tamu yang tadinya bisa memotret.
 */
export function canGuestUpload(
  guest: Pick<GuestRow, 'can_upload' | 'removed_at'> | null,
): boolean {
  if (!guest) return false
  if (isGuestRemoved(guest)) return false
  return guest.can_upload !== false
}

/**
 * Tamu yang dikeluarkan host.
 *
 * Barisnya sengaja tidak dihapus, jadi status ini yang menggantikan
 * ketiadaannya: perangkat yang sama tidak bisa kembali sebagai orang baru.
 */
export function isGuestRemoved(guest: Pick<GuestRow, 'removed_at'> | null): boolean {
  return Boolean(guest?.removed_at)
}

/** Kebijakan acara, dengan default aman kalau kolomnya belum ada. */
export function uploadPolicyOf(event: Pick<EventRow, 'upload_policy'>): UploadPolicy {
  return event.upload_policy === 'approval' ? 'approval' : 'open'
}

/** Hak yang diberikan ke tamu yang BARU bergabung. */
export function initialCanUpload(event: Pick<EventRow, 'upload_policy'>): boolean {
  return uploadPolicyOf(event) === 'open'
}
