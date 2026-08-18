'use client'

const DEVICE_ID_KEY = 'rol.device_id'

/**
 * ID perangkat yang persist di localStorage. Ini "identitas" guest, tidak ada
 * login, jadi satu browser = satu guest. Sengaja bukan mekanisme keamanan:
 * fungsinya cuma supaya guest yang sama tidak dobel terdaftar dan foto bisa
 * dikaitkan ke nama yang benar.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getDeviceId() hanya bisa dipanggil di browser')
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing

  const fresh = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, fresh)
  return fresh
}

const guestNameKey = (eventId: string) => `rol.guest_name.${eventId}`

/** Nama yang sudah dipakai guest di event ini, kalau sebelumnya pernah join. */
export function getStoredGuestName(eventId: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(guestNameKey(eventId))
}

export function storeGuestName(eventId: string, name: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(guestNameKey(eventId), name)
}

export function clearGuestName(eventId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(guestNameKey(eventId))
}
