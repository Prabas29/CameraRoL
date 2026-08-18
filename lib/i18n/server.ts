import 'server-only'

import { cookies, headers } from 'next/headers'

import {
  DEFAULT_LOCALE,
  LOCALES,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from '@/lib/i18n/dictionaries'

export const LOCALE_COOKIE = 'rol_locale'

export const localeCookieOptions = {
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
}

/**
 * Menebak bahasa dari header Accept-Language browser.
 *
 * Hanya dipakai saat pengunjung belum pernah memilih. Sekali memilih, pilihan
 * manual disimpan di cookie dan selalu menang.
 */
function detectFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';q=')
      return { tag: tag.trim().toLowerCase(), q: quality ? Number(quality) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (LOCALES.includes(base as Locale)) return base as Locale
  }

  return DEFAULT_LOCALE
}

/** Bahasa aktif untuk request ini: cookie dulu, baru tebakan dari browser. */
export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(stored)) return stored

  return detectFromHeader((await headers()).get('accept-language'))
}

export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale())
}

/** Locale + kamusnya sekaligus, untuk halaman yang juga perlu memformat tanggal. */
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale()
  return { locale, t: getDictionary(locale) }
}
