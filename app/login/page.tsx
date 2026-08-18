import Link from 'next/link'

import { FilmStripMark } from '@/components/film-strip-mark'
import { LanguageSwitcher } from '@/components/language-switcher'
import { LoginForm } from '@/components/login-form'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t.meta.login }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const t = await getT()

  return (
    /*
     * Struktur onboarding iOS: visual di atas, teks di tengah, aksi menumpuk
     * di bawah. `justify-between` dengan spacer membuat tombol tetap dekat
     * ibu jari di layar tinggi, tanpa mengambang di tengah pada layar pendek.
     */
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col px-6 py-8">
      <div className="flex justify-center">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <FilmStripMark className="w-36 drop-shadow-sm sm:w-40" />

        <div className="grid gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.login.title}</h1>
          <p className="text-balance leading-relaxed text-muted-foreground">{t.login.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 pt-10">
        <LoginForm nextPath={next ?? ''} linkError={error ?? null} />

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t.login.hostOnly}
        </p>

        <Link
          href="/"
          className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.login.backHome}
        </Link>
      </div>
    </main>
  )
}
