import { NextResponse, type NextRequest } from 'next/server'

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
 * Balasannya menyetel cookie httpOnly berisi id guest — sejak titik ini server
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
    return NextResponse.json({ error: t.api.joinFailed }, { status: 500 })
  }

  const response = NextResponse.json({ guestId: guest.id, name: guest.name })
  response.cookies.set(guestCookieName(eventId), guest.id, guestCookieOptions)
  return response
}
