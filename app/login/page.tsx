import Link from 'next/link'

import { FilmStripMark } from '@/components/film-strip-mark'
import { LoginForm } from '@/components/login-form'

export const metadata = {
  title: 'Masuk — Rol',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    /*
     * Struktur onboarding iOS: visual di atas, teks di tengah, aksi menumpuk
     * di bawah. `justify-between` dengan spacer membuat tombol tetap dekat
     * ibu jari di layar tinggi, tanpa mengambang di tengah pada layar pendek.
     */
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <FilmStripMark className="w-36 drop-shadow-sm sm:w-40" />

        <div className="grid gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Selamat datang di Rol
          </h1>
          <p className="text-balance leading-relaxed text-muted-foreground">
            Buat acara, bagikan momen — seperti kamera sekali pakai, tapi digital.
          </p>
        </div>
      </div>

      <div className="grid gap-6 pt-10">
        <LoginForm nextPath={next ?? ''} linkError={error ?? null} />

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Login hanya untuk host. Tamu tidak perlu akun — cukup buka link atau scan QR
          yang kamu bagikan.
        </p>

        <Link
          href="/"
          className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Kembali ke halaman utama
        </Link>
      </div>
    </main>
  )
}
