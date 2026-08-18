'use server'

import { headers } from 'next/headers'

import { siteUrl } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export interface LoginResult {
  error: string | null
  sentTo: string | null
}

/**
 * Mengirim magic link dari server, bukan dari browser.
 *
 * Sebelumnya form ini memanggil supabase-js langsung di client, dan itu berarti
 * @supabase/ssr + auth-js (164 kB) ikut ter-bundle hanya untuk satu tombol.
 * Dipindah ke server action, halaman login tidak perlu memuat SDK sama sekali.
 */
export async function sendMagicLink(
  _prev: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const email = String(formData.get('email') ?? '').trim()
  const nextPath = String(formData.get('next') ?? '')

  if (!email || !email.includes('@')) {
    return { error: 'Masukkan alamat email yang valid.', sentTo: null }
  }

  // Pakai origin dari request kalau ada, supaya deployment preview tetap
  // mengirim link yang kembali ke preview itu sendiri.
  const requestOrigin = (await headers()).get('origin')
  const base = requestOrigin ?? siteUrl()

  const callback = new URL('/auth/callback', base)
  if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    callback.searchParams.set('next', nextPath)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback.toString() },
  })

  if (error) return { error: error.message, sentTo: null }

  return { error: null, sentTo: email }
}
