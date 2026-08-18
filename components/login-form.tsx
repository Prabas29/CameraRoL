'use client'

import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'

import { sendMagicLink, type LoginResult } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Link tidak lengkap. Coba kirim ulang link masuk.',
  invalid_link: 'Link sudah dipakai atau kedaluwarsa. Kirim ulang, ya.',
}

const initialState: LoginResult = { error: null, sentTo: null }

export function LoginForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? ''
  const linkError = searchParams.get('error')

  const [state, formAction, pending] = useActionState(sendMagicLink, initialState)

  // Pengiriman link ditangani server action, jadi komponen ini tidak perlu
  // memuat supabase-js sama sekali.
  if (state.sentTo) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cek emailmu</CardTitle>
          <CardDescription>
            Link masuk sudah dikirim ke <span className="text-foreground">{state.sentTo}</span>.
            Buka link itu di perangkat ini untuk melanjutkan.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const error = state.error ?? (linkError ? (ERROR_MESSAGES[linkError] ?? 'Link masuk bermasalah.') : null)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Masuk sebagai host</CardTitle>
        <CardDescription>
          Kami kirimkan link sekali pakai ke emailmu. Tidak perlu password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="next" value={nextPath} />

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="kamu@email.com"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={pending}>
            {pending ? 'Mengirim…' : 'Kirim link masuk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
