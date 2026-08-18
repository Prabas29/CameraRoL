import { NextResponse } from 'next/server'

import { STORAGE_BUCKET } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ENDPOINT DIAGNOSTIK SEMENTARA — HAPUS SETELAH DEPLOYMENT TERBUKTI SEHAT.
 *
 * Tujuannya menjawab satu pertanyaan yang tidak bisa dijawab dari luar:
 * nilai apa yang sebenarnya dibaca server untuk SUPABASE_SERVICE_ROLE_KEY.
 *
 * Yang dilaporkan sengaja dibatasi pada 10 karakter pertama — cukup untuk
 * membedakan "sb_secret_", "sb_publis", dan "eyJhbGciOi", tapi tidak cukup
 * untuk dipakai siapa pun. Panjang key juga dilaporkan karena spasi atau
 * newline yang ikut ter-paste akan terlihat dari situ.
 */
export const dynamic = 'force-dynamic'

function describeKey(value: string | undefined) {
  if (!value) return { ada: false }

  return {
    ada: true,
    awalan: value.slice(0, 10),
    panjang: value.length,
    adaSpasiAtauNewline: /\s/.test(value),
    format:
      value.startsWith('sb_secret_')
        ? 'service_role (format baru) — BENAR'
        : value.startsWith('sb_publishable_')
          ? 'anon/publishable — SALAH, ini yang bikin RLS memblokir semua'
          : value.startsWith('eyJ')
            ? 'JWT legacy — bisa anon atau service_role, tidak bisa dibedakan dari awalan'
            : 'tidak dikenali',
  }
}

export async function GET() {
  const report: Record<string, unknown> = {
    vercelEnv: process.env.VERCEL_ENV ?? '(bukan Vercel)',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    siteUrlTerdeteksi: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
    serviceRoleKey: describeKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
    anonKey: describeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  }

  try {
    const admin = createAdminClient()

    const { data, error } = await admin.from('events').select('id, name')
    report.queryEvents = error
      ? { gagal: true, pesan: error.message, kode: error.code }
      : { gagal: false, jumlahEvent: data?.length ?? 0 }

    const { data: buckets, error: bucketError } = await admin.storage.listBuckets()
    report.storage = bucketError
      ? { gagal: true, pesan: bucketError.message }
      : { gagal: false, bucket: buckets?.map((b) => b.id), targetAda: buckets?.some((b) => b.id === STORAGE_BUCKET) }
  } catch (caught) {
    report.queryEvents = {
      gagal: true,
      pesan: caught instanceof Error ? caught.message : String(caught),
    }
  }

  return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
