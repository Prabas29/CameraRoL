import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { I18nProvider } from '@/components/i18n-provider'
import { Toaster } from '@/components/ui/sonner'
import { getI18n } from '@/lib/i18n/server'

import './globals.css'

// Namanya --font-geist-sans, bukan --font-sans: globals.css menyusun
// --font-sans sebagai rantai lengkap (Geist → -apple-system → …), jadi kalau
// next/font ikut memakai nama itu, keduanya saling menimpa.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/** Judul & deskripsi ikut bahasa aktif, jadi metadata dibuat per-request. */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()

  return {
    title: t.meta.homeTitle,
    description: t.meta.homeDescription,
  }
}

export const viewport: Viewport = {
  themeColor: '#fafaf9',
  // Halaman kamera memakai tinggi layar penuh; cegah zoom tak sengaja saat
  // menekan tombol shutter.
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { locale } = await getI18n()

  return (
    // Variabel font harus di <html>, bukan <body>: globals.css memakai
    // `html { @apply font-sans }`, dan CSS custom property hanya mewaris ke
    // bawah. Kalau dipasang di <body>, `var(--font-sans)` di <html> tidak
    // terdefinisi dan seluruh halaman jatuh ke font serif bawaan browser.
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
