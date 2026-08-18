'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { siteUrl } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

/**
 * `error` berisi KUNCI pesan (mis. 'invalidEmail'), bukan kalimat jadi.
 *
 * Server action tidak tahu bahasa mana yang sedang ditampilkan di tab pengguna,
 * dan mengembalikan kalimat berbahasa Indonesia ke antarmuka berbahasa Inggris
 * akan terlihat janggal. Komponen client yang menerjemahkan kuncinya.
 */
export interface LoginResult {
  error: string | null
  sentTo: string | null
}

/**
 * Merangkai URL /auth/callback, lengkap dengan tujuan setelah login.
 *
 * Origin diambil dari request supaya deployment preview mengembalikan pengguna
 * ke preview itu sendiri, bukan ke produksi.
 */
async function callbackUrl(nextPath: string): Promise<string> {
  const base = (await headers()).get('origin') ?? siteUrl()
  const callback = new URL('/auth/callback', base)

  // Hanya path relatif, supaya parameter ini tidak bisa dipakai melempar orang
  // ke domain lain setelah login.
  if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    callback.searchParams.set('next', nextPath)
  }

  return callback.toString()
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
    return { error: 'invalidEmail', sentTo: null }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(nextPath) },
  })

  if (error) return { error: 'generic', sentTo: null }

  return { error: null, sentTo: email }
}

/**
 * Login lewat Google.
 *
 * Dijalankan di server, bukan di browser. `skipBrowserRedirect` membuat
 * supabase-js mengembalikan URL otorisasi Google alih-alih langsung
 * mengarahkan halaman, lalu server yang me-redirect ke sana.
 *
 * Kenapa begitu: memanggil signInWithOAuth dari komponen client mengharuskan
 * supabase-js ikut ter-bundle ke browser (~164 kB) hanya demi satu tombol.
 * Lewat server action, halaman login tetap tidak memuat SDK sama sekali.
 * PKCE tetap benar karena code_verifier disimpan sebagai cookie oleh server
 * client yang sama dengan yang nanti menukarkan kodenya di /auth/callback.
 *
 * Client ID & secret Google sepenuhnya ada di sisi Supabase — tidak ada
 * kredensial Google apa pun di repo ini.
 */
export async function signInWithGoogle(
  _prev: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const nextPath = String(formData.get('next') ?? '')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: await callbackUrl(nextPath),
      skipBrowserRedirect: true,
    },
  })

  if (error || !data?.url) {
    return { error: 'googleUnreachable', sentTo: null }
  }

  // redirect() melempar sinyal internal Next, jadi harus di luar try/catch.
  redirect(data.url)
}
