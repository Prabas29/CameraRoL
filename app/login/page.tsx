import Link from 'next/link'
import { Suspense } from 'react'

import { LoginForm } from '@/components/login-form'

export const metadata = {
  title: 'Masuk — Rol',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="text-2xl font-semibold tracking-tight">
        Rol<span className="text-primary">.</span>
      </Link>

      <Suspense>
        <LoginForm />
      </Suspense>

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Login hanya untuk host. Tamu tidak perlu akun — cukup buka link atau scan QR
        yang kamu bagikan.
      </p>
    </main>
  )
}
