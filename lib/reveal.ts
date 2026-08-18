import type { EventRow } from '@/types/database'

export type RevealableEvent = Pick<EventRow, 'is_revealed' | 'reveal_at' | 'reveal_mode'>

/**
 * Satu-satunya definisi "event sudah terbuka".
 *
 * Dipakai di server (gerbang sebenarnya, sebelum menerbitkan signed URL) dan
 * di client (hanya untuk menentukan tampilan). Client TIDAK dipercaya:
 * memanipulasi jam perangkat cuma mengubah UI, bukan akses foto.
 */
export function isRevealed(event: RevealableEvent, now: number = Date.now()): boolean {
  if (event.is_revealed) return true
  if (!event.reveal_at) return false
  return new Date(event.reveal_at).getTime() <= now
}

/** Sisa waktu menuju reveal dalam milidetik. 0 kalau sudah lewat/manual. */
export function msUntilReveal(event: RevealableEvent, now: number = Date.now()): number {
  if (event.is_revealed || !event.reveal_at) return 0
  return Math.max(0, new Date(event.reveal_at).getTime() - now)
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function splitDuration(ms: number): CountdownParts {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export function formatRevealTime(iso: string): string {
  return dateFormatter.format(new Date(iso))
}
