import { createBrowserClient } from '@supabase/ssr'

import { publicEnv } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * Client Supabase untuk browser. Dipakai HANYA di sisi host — untuk mengirim
 * magic link dan membaca data event miliknya (dijaga RLS).
 *
 * Guest tidak pernah memakai client ini. Semua aksi guest lewat route handler.
 */
export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
}
