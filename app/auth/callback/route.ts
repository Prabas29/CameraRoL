import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Tujuan redirect magic link. Menukar kode OTP jadi sesi, lalu melempar host
 * ke dashboard (atau ke halaman yang tadi ingin dibuka).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Hanya izinkan redirect relatif, supaya link tidak bisa dipakai untuk
  // melempar orang ke domain lain.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
