'use client'

import { createContext, useContext } from 'react'

import { DEFAULT_LOCALE, getDictionary, type Dictionary, type Locale } from '@/lib/i18n/dictionaries'

interface I18nValue {
  locale: Locale
  t: Dictionary
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: getDictionary(DEFAULT_LOCALE),
})

/**
 * Menyalurkan kamus ke komponen client.
 *
 * Yang dioper dari server hanyalah kode bahasanya; kamusnya sendiri di-resolve
 * di sini. Sebabnya teknis: banyak entri berupa fungsi (untuk plural dan
 * penyisipan nilai), dan fungsi tidak bisa diserialisasi melewati batas RSC.
 *
 * Konsekuensinya kedua bahasa ikut ter-bundle ke browser, sekitar 8 kB
 * ter-gzip. Itu harga yang wajar untuk API yang bisa menangani plural dengan
 * benar; alternatifnya adalah template string berplaceholder, yang tidak bisa
 * membedakan "1 photo" dari "2 photos".
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}

/** Pintasan untuk komponen yang hanya butuh teks. */
export function useT(): Dictionary {
  return useContext(I18nContext).t
}
