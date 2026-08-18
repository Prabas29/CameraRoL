'use client'

import { MailIcon } from 'lucide-react'
import { useActionState, useState } from 'react'

import { sendMagicLink, signInWithGoogle, type LoginResult } from '@/app/login/actions'
import { GoogleLogo } from '@/components/google-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Link tidak lengkap. Coba masuk sekali lagi.',
  exchange_failed: 'Link sudah dipakai atau kedaluwarsa. Kirim ulang, ya.',
  google_denied: 'Kamu membatalkan izin di Google. Coba lagi kalau berubah pikiran.',
  oauth_failed: 'Login lewat Google gagal. Coba lagi atau pakai email.',
}

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
  const [emailState, sendEmail, sendingEmail] = useActionState(sendMagicLink, initialState)
  const [googleState, startGoogle, startingGoogle] = useActionState(signInWithGoogle, initialState)

  const [emailOpen, setEmailOpen] = useState(false)

  // Setelah link terkirim, seluruh pilihan login diganti konfirmasi — menyisakan
  // tombol lain hanya mengundang orang mengklik ulang dan membatalkan link tadi.
  if (emailState.sentTo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cek emailmu</CardTitle>
          <CardDescription className="leading-relaxed">
            Link masuk sudah dikirim ke{' '}
            <span className="text-foreground">{emailState.sentTo}</span>. Buka link itu di
            perangkat ini untuk melanjutkan.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const error =
    googleState.error ??
    emailState.error ??
    (linkError ? (ERROR_MESSAGES[linkError] ?? 'Login bermasalah. Coba lagi.') : null)

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
          {startingGoogle ? 'Menghubungkan…' : 'Lanjutkan dengan Google'}
        </Button>
      </form>

      {emailOpen ? (
        <form action={sendEmail} className="grid gap-3 duration-200 animate-in fade-in slide-in-from-top-1">
          <input type="hidden" name="next" value={nextPath} />

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">
              Alamat email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="kamu@email.com"
              required
              autoFocus
            />
          </div>

          <Button type="submit" size="lg" disabled={sendingEmail} className="w-full">
            {sendingEmail ? 'Mengirim…' : 'Kirim link masuk'}
          </Button>

          <button
            type="button"
            onClick={() => setEmailOpen(false)}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Batal
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
          Masuk dengan Email
        </Button>
      )}
    </div>
  )
}
