import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { publicEnv, serverEnv } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * Client service_role — MELEWATI SEMUA RLS.
 *
 * Ini tulang punggung model "server-gated": guest tidak punya key Supabase
 * sama sekali, jadi setiap aksi guest (join, upload, baca gallery) harus
 * melewati route handler yang memakai client ini, dan route handler itulah
 * yang menegakkan aturan reveal.
 *
 * Import `server-only` di atas membuat build gagal kalau file ini tidak
 * sengaja terseret ke bundle client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}
