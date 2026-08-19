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
export function canGuestUpload(guest: Pick<GuestRow, 'can_upload'> | null): boolean {
  if (!guest) return false
  return guest.can_upload !== false
}

/** Kebijakan acara, dengan default aman kalau kolomnya belum ada. */
export function uploadPolicyOf(event: Pick<EventRow, 'upload_policy'>): UploadPolicy {
  return event.upload_policy === 'approval' ? 'approval' : 'open'
}

/** Hak yang diberikan ke tamu yang BARU bergabung. */
export function initialCanUpload(event: Pick<EventRow, 'upload_policy'>): boolean {
  return uploadPolicyOf(event) === 'open'
}
