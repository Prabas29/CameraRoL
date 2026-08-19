import { NextResponse, type NextRequest } from 'next/server'

import { initialCanUpload } from '@/lib/access'
import { getPublicEvent, isUuid } from '@/lib/events'
import { guestCookieName, guestCookieOptions } from '@/lib/guest-session'
import { getT } from '@/lib/i18n/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface JoinBody {
  deviceId?: unknown
  name?: unknown
}

/**
 * Tamu bergabung ke event.
 *
 * Menerima device id dari localStorage + nama, lalu meng-upsert baris `guests`.
 * Balasannya menyetel cookie httpOnly berisi id guest, sejak titik ini server
 * tidak perlu lagi mempercayai device id yang dikirim browser.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params
  const t = await getT()

  if (!isUuid(eventId)) {
    return NextResponse.json({ error: t.api.eventNotFound }, { status: 404 })
  }

  let body: JoinBody
  try {
    body = (await request.json()) as JoinBody
  } catch {
    return NextResponse.json({ error: t.api.invalidRequest }, { status: 400 })
  }

  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!isUuid(deviceId)) {
    return NextResponse.json({ error: t.api.deviceUnknown }, { status: 400 })
  }
  if (name.length < 1 || name.length > 40) {
    return NextResponse.json({ error: t.api.nameRequired }, { status: 400 })
  }

  const event = await getPublicEvent(eventId)
  if (!event) {
    return NextResponse.json({ error: t.api.eventNotFound }, { status: 404 })
  }

  const admin = createAdminClient()

  // Satu device = satu tamu per event (unique constraint di event_id+device_id).
  //
  // Sengaja TIDAK memakai upsert satu langkah. Upsert akan menulis ulang semua
  // kolom yang disertakan, termasuk can_upload, sehingga tamu yang sudah
  // diizinkan host akan kehilangan izinnya begitu ia membuka link lagi. Karena
  // itu jalur "sudah ada" hanya menyentuh nama, dan can_upload cuma ditetapkan
  // saat baris benar-benar baru dibuat.
  const { data: existing } = await admin
    .from('guests')
    .select('id')
    .eq('event_id', eventId)
    .eq('device_id', deviceId)
    .maybeSingle()

  let guest: { id: string; name: string } | null = null

  if (existing) {
    const { data, error } = await admin
      .from('guests')
      .update({ name })
      .eq('id', existing.id)
      .select('id, name')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: t.api.joinFailed }, { status: 500 })
    }
    guest = data
  } else {
    const newRow = { event_id: eventId, device_id: deviceId, name }

    let { data, error } = await admin
      .from('guests')
      .insert({ ...newRow, can_upload: initialCanUpload(event) })
      .select('id, name')
      .single()

    // Kolom belum ada, artinya migration 0003 belum dijalankan. Tamu tetap
    // harus bisa bergabung, sekadar tanpa kendali hak unggah, supaya urutan
    // deploy dan migration tidak saling mengunci.
    if (error?.code === 'PGRST204' || error?.code === '42703') {
      console.warn(
        '[rol] Kolom can_upload belum ada. Jalankan supabase/migrations/0003_upload_access.sql ' +
          'agar kendali hak unggah aktif.',
      )
      ;({ data, error } = await admin.from('guests').insert(newRow).select('id, name').single())
    }

    if (error || !data) {
      return NextResponse.json({ error: t.api.joinFailed }, { status: 500 })
    }
    guest = data
  }

  const response = NextResponse.json({ guestId: guest.id, name: guest.name })
  response.cookies.set(guestCookieName(eventId), guest.id, guestCookieOptions)
  return response
}
