'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Link tidak lengkap. Coba kirim ulang link masuk.',
  invalid_link: 'Link sudah dipakai atau kedaluwarsa. Kirim ulang, ya.',
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')
  const linkError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(
    linkError ? (ERROR_MESSAGES[linkError] ?? 'Link masuk bermasalah.') : null,
  )

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    setError(null)
    setStatus('sending')

    const supabase = createClient()
    const callback = new URL('/auth/callback', window.location.origin)
    if (nextPath?.startsWith('/')) callback.searchParams.set('next', nextPath)

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback.toString() },
    })

    if (signInError) {
      setError(signInError.message)
      setStatus('idle')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cek emailmu</CardTitle>
          <CardDescription>
            Link masuk sudah dikirim ke <span className="text-foreground">{email}</span>.
            Buka link itu di perangkat ini untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full" onClick={() => setStatus('idle')}>
            Pakai email lain
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Masuk sebagai host</CardTitle>
        <CardDescription>
          Kami kirimkan link sekali pakai ke emailmu. Tidak perlu password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="kamu@email.com"
              required
              value={email}
              onChange={(changeEvent) => setEmail(changeEvent.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Mengirim…' : 'Kirim link masuk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
