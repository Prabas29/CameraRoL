import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
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
  themeColor: '#1a1713',
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
    <html lang="id" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
