import { NextResponse, type NextRequest } from 'next/server'

import { STORAGE_BUCKET } from '@/lib/env'
import { getPublicEvent, isUuid } from '@/lib/events'
import { getGuest } from '@/lib/guest-session'
import { filteredPath, originalPath, thumbPath } from '@/lib/photos'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type PhotoInsert = Database['public']['Tables']['photos']['Insert']

const MAX_BYTES = 10 * 1024 * 1024 // sejalan dengan file_size_limit bucket

/**
 * Menerima satu foto dari tamu.
 *
 * Dua file diunggah sekaligus: versi mentah tanpa filter (arsip, dipakai kalau
 * nanti perlu render ulang) dan versi yang filternya sudah di-bake di browser
 * (yang ditampilkan di gallery).
 *
 * Tidak ada balasan berisi URL — foto memang tidak boleh terlihat sebelum
 * reveal, termasuk oleh yang memotretnya.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params

  if (!isUuid(eventId)) {
    return NextResponse.json({ error: 'Acara tidak ditemukan.' }, { status: 404 })
  }

  const event = await getPublicEvent(eventId)
  if (!event) {
    return NextResponse.json({ error: 'Acara tidak ditemukan.' }, { status: 404 })
  }

  // Identitas diambil dari cookie httpOnly, bukan dari body — browser tidak bisa
  // mengaku-ngaku jadi tamu lain.
  const guest = await getGuest(eventId)
  if (!guest) {
    return NextResponse.json({ error: 'Kamu belum bergabung ke acara ini.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 })
  }

  const original = formData.get('original')
  const filtered = formData.get('filtered')
  const thumbnail = formData.get('thumbnail')

  if (!(original instanceof File) || !(filtered instanceof File)) {
    return NextResponse.json({ error: 'Foto tidak lengkap.' }, { status: 400 })
  }
  if (original.size === 0 || filtered.size === 0) {
    return NextResponse.json({ error: 'Foto kosong.' }, { status: 400 })
  }
  if (original.size > MAX_BYTES || filtered.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto terlalu besar.' }, { status: 413 })
  }

  const hasThumb = thumbnail instanceof File && thumbnail.size > 0

  const admin = createAdminClient()
  const photoId = crypto.randomUUID()
  const originalKey = originalPath(eventId, photoId)
  const filteredKey = filteredPath(eventId, photoId)
  const thumbKey = thumbPath(eventId, photoId)

  const uploadOptions = { contentType: 'image/jpeg', upsert: false }

  const uploads = await Promise.all([
    admin.storage.from(STORAGE_BUCKET).upload(originalKey, original, uploadOptions),
    admin.storage.from(STORAGE_BUCKET).upload(filteredKey, filtered, uploadOptions),
    ...(hasThumb
      ? [admin.storage.from(STORAGE_BUCKET).upload(thumbKey, thumbnail, uploadOptions)]
      : []),
  ])

  const allKeys = hasThumb ? [originalKey, filteredKey, thumbKey] : [originalKey, filteredKey]

  const failed = uploads.find((upload) => upload.error)
  if (failed) {
    // Bersihkan file yang sempat naik supaya tidak ada sampah tanpa baris DB.
    await admin.storage.from(STORAGE_BUCKET).remove(allKeys)
    return NextResponse.json({ error: 'Gagal mengunggah foto.' }, { status: 502 })
  }

  const baseRow: PhotoInsert = {
    id: photoId,
    event_id: eventId,
    guest_id: guest.id,
    storage_path: originalKey,
    filtered_storage_path: filteredKey,
    film_style_applied: event.film_style,
  }

  const row: PhotoInsert = hasThumb ? { ...baseRow, thumb_storage_path: thumbKey } : baseRow

  let { error: insertError } = await admin.from('photos').insert(row)

  // Kolom tidak dikenal, artinya migration 0002 belum dijalankan di project
  // Supabase ini. Dua kode karena sumbernya berbeda: PostgREST menolak lebih
  // dulu lewat schema cache-nya (PGRST204), sementara 42703 datang dari
  // Postgres sendiri. Foto tetap harus tersimpan — sekadar tanpa thumbnail —
  // supaya urutan deploy dan migration tidak saling mengunci.
  if (insertError?.code === 'PGRST204' || insertError?.code === '42703') {
    console.warn(
      '[rol] Kolom thumb_storage_path belum ada. Jalankan supabase/migrations/0002_thumbnails.sql ' +
        'agar gallery memuat thumbnail, bukan foto ukuran penuh.',
    )
    ;({ error: insertError } = await admin.from('photos').insert(baseRow))
  }

  if (insertError) {
    await admin.storage.from(STORAGE_BUCKET).remove(allKeys)
    return NextResponse.json({ error: 'Gagal menyimpan foto.' }, { status: 500 })
  }

  return NextResponse.json({ id: photoId }, { status: 201 })
}
