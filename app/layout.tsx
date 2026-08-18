import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'

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

export const metadata: Metadata = {
  title: 'Rol — kamera sekali pakai untuk acaramu',
  description:
    'Bagikan satu QR ke semua tamu. Mereka memotret, hasilnya terkunci, dan semuanya terbuka bersamaan saat acara usai.',
}

export const viewport: Viewport = {
  themeColor: '#fafaf9',
  // Halaman kamera memakai tinggi layar penuh; cegah zoom tak sengaja saat
  // menekan tombol shutter.
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Variabel font harus di <html>, bukan <body>: globals.css memakai
    // `html { @apply font-sans }`, dan CSS custom property hanya mewaris ke
    // bawah. Kalau dipasang di <body>, `var(--font-sans)` di <html> tidak
    // terdefinisi dan seluruh halaman jatuh ke font serif bawaan browser.
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
