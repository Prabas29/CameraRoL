'use client'

import { MailIcon } from 'lucide-react'
import { useActionState, useState } from 'react'

import { sendMagicLink, signInWithGoogle, type LoginResult } from '@/app/login/actions'
import { GoogleLogo } from '@/components/google-logo'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: LoginResult = { error: null, sentTo: null }

/**
 * `next` dan `error` diterima sebagai prop, bukan lewat useSearchParams.
 *
 * useSearchParams memaksa komponen ini keluar dari render server, sehingga
 * seluruh tombol login baru muncul setelah JavaScript selesai dimuat —
 * pengunjung melihat kerangka kosong lebih dulu. Sebagai prop, tombolnya sudah
 * ada di HTML pertama.
 */
export function LoginForm({
  nextPath = '',
  linkError = null,
}: {
  nextPath?: string
  linkError?: string | null
}) {
  const t = useT()

  const [emailState, sendEmail, sendingEmail] = useActionState(sendMagicLink, initialState)
  const [googleState, startGoogle, startingGoogle] = useActionState(signInWithGoogle, initialState)

  const [emailOpen, setEmailOpen] = useState(false)

  // Setelah link terkirim, seluruh pilihan login diganti konfirmasi — menyisakan
  // tombol lain hanya mengundang orang mengklik ulang dan membatalkan link tadi.
  if (emailState.sentTo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.login.sentTitle}</CardTitle>
          <CardDescription className="leading-relaxed">
            {t.login.sentBodyBefore}
            <span className="text-foreground">{emailState.sentTo}</span>
            {t.login.sentBodyAfter}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Server action mengirim kunci pesan, bukan kalimat jadi, supaya teksnya bisa
  // mengikuti bahasa yang sedang aktif di browser.
  const errorKey = googleState.error ?? emailState.error ?? linkError
  const error = errorKey
    ? (t.login.errors[errorKey as keyof typeof t.login.errors] ?? t.login.errors.generic)
    : null

  return (
    <div className="grid gap-3">
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      ) : null}

      <form action={startGoogle}>
        <input type="hidden" name="next" value={nextPath} />
        <Button
          type="submit"
          size="lg"
          variant="outline"
          disabled={startingGoogle}
          className="w-full bg-card"
        >
          <GoogleLogo />
          {startingGoogle ? t.login.googleLoading : t.login.google}
        </Button>
      </form>

      {emailOpen ? (
        <form
          action={sendEmail}
          className="grid gap-3 duration-200 animate-in fade-in slide-in-from-top-1"
        >
          <input type="hidden" name="next" value={nextPath} />

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">
              {t.login.emailLabel}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t.login.emailPlaceholder}
              required
              autoFocus
            />
          </div>

          <Button type="submit" size="lg" disabled={sendingEmail} className="w-full">
            {sendingEmail ? t.login.sending : t.login.sendLink}
          </Button>

          <button
            type="button"
            onClick={() => setEmailOpen(false)}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.common.cancel}
          </button>
        </form>
      ) : (
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => setEmailOpen(true)}
        >
          <MailIcon />
          {t.login.withEmail}
        </Button>
      )}
    </div>
  )
}
