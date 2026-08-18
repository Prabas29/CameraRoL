'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { isLocale } from '@/lib/i18n/dictionaries'
import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/i18n/server'

/**
 * Menyimpan pilihan bahasa.
 *
 * Disimpan di cookie, bukan di URL. Konsekuensinya: link undangan tidak membawa
 * bahasa, jadi tiap tamu melihat halaman dalam bahasanya sendiri — bukan bahasa
 * host yang membagikan link. Untuk acara dengan tamu campuran, itu justru
 * perilaku yang diinginkan.
 */
export async function setLocale(formData: FormData) {
  const next = String(formData.get('locale') ?? '')
  if (!isLocale(next)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, next, localeCookieOptions)

  revalidatePath('/', 'layout')
}
