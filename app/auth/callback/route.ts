import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Tujuan redirect untuk KEDUA cara masuk: magic link dan OAuth Google.
 *
 * Penukaran kodenya sendiri memang sudah generic, `exchangeCodeForSession`
 * menangani alur PKCE apa pun, tanpa perlu tahu providernya. Yang berbeda cuma
 * cara kegagalan dilaporkan: OAuth tidak mengirim `code`, melainkan `error` dan
 * `error_description` sebagai query param (misalnya saat pengguna menolak izin
 * di layar consent Google).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Hanya izinkan redirect relatif, supaya link tidak bisa dipakai untuk
  // melempar orang ke domain lain.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  const providerError = searchParams.get('error')
  if (providerError) {
    // access_denied = pengguna menekan "Batal" di layar consent. Itu pilihan
    // yang sah, bukan kerusakan, jadi pesannya dibedakan dari kegagalan nyata.
    const reason = providerError === 'access_denied' ? 'google_denied' : 'oauth_failed'
    return NextResponse.redirect(`${origin}/login?error=${reason}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
