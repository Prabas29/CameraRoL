import { NextResponse, type NextRequest } from 'next/server'

import { getPublicEvent, isUuid } from '@/lib/events'
import { guestCookieName, guestCookieOptions } from '@/lib/guest-session'
import { createAdminClient } from '@/lib/supabase/admin'

interface JoinBody {
  deviceId?: unknown
  name?: unknown
}

/**
 * Tamu bergabung ke event.
 *
 * Menerima device id dari localStorage + nama, lalu meng-upsert baris `guests`.
 * Balasannya menyetel cookie httpOnly berisi id guest — sejak titik ini server
 * tidak perlu lagi mempercayai device id yang dikirim browser.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params

  if (!isUuid(eventId)) {
    return NextResponse.json({ error: 'Acara tidak ditemukan.' }, { status: 404 })
  }

  let body: JoinBody
  try {
    body = (await request.json()) as JoinBody
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 })
  }

  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!isUuid(deviceId)) {
    return NextResponse.json({ error: 'Perangkat tidak dikenali.' }, { status: 400 })
  }
  if (name.length < 1 || name.length > 40) {
    return NextResponse.json({ error: 'Nama wajib diisi, maksimal 40 karakter.' }, { status: 400 })
  }

  const event = await getPublicEvent(eventId)
  if (!event) {
    return NextResponse.json({ error: 'Acara tidak ditemukan.' }, { status: 404 })
  }

  const admin = createAdminClient()

  // Satu device = satu tamu per event (unique constraint di event_id+device_id).
  // Join ulang hanya memperbarui namanya, bukan membuat tamu baru — supaya foto
  // lama tetap terkait ke orang yang sama.
  const { data: guest, error } = await admin
    .from('guests')
    .upsert(
      { event_id: eventId, device_id: deviceId, name },
      { onConflict: 'event_id,device_id' },
    )
    .select('id, name')
    .single()

  if (error || !guest) {
    return NextResponse.json({ error: 'Gagal bergabung. Coba lagi.' }, { status: 500 })
  }

  const response = NextResponse.json({ guestId: guest.id, name: guest.name })
  response.cookies.set(guestCookieName(eventId), guest.id, guestCookieOptions)
  return response
}
