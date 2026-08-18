import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { publicEnv } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * Client Supabase untuk Server Component & Route Handler, memakai anon key.
 * Sesi host dibaca dari cookie, jadi RLS berlaku sesuai user yang login.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Dipanggil dari Server Component, di mana cookie read-only.
          // Aman diabaikan: middleware yang bertugas merefresh sesi.
        }
      },
    },
  })
}
