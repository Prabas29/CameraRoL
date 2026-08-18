import { NextResponse, type NextRequest } from 'next/server'

import { isUuid } from '@/lib/events'
import { guestCookieName, guestCookieOptions } from '@/lib/guest-session'
import { createAdminClient } from '@/lib/supabase/admin'

interface ResumeBody {
  deviceId?: unknown
}

/**
 * Memulihkan sesi tamu dari device id yang tersimpan di localStorage.
 *
 * Kenapa perlu: identitas tamu dipegang cookie httpOnly, dan cookie bisa hilang
 * lebih dulu daripada localStorage. Kedaluwarsa, dibersihkan browser, atau
 * dibuka dari in-app browser yang punya jar cookie sendiri, semuanya membuat
 * tamu diminta mengetik nama lagi padahal dia sudah pernah bergabung.
 *
 * Endpoint ini tidak membuat tamu baru. Kalau pasangan (event, device) belum
 * pernah terdaftar, jawabannya sekadar "tidak ada" dan alur join normal
 * berjalan seperti biasa. Jadi ini pemulihan, bukan jalan pintas untuk
 * melewati pengisian nama.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params

  if (!isUuid(eventId)) {
    return NextResponse.json({ found: false }, { status: 404 })
  }

  let body: ResumeBody
  try {
    body = (await request.json()) as ResumeBody
  } catch {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''
  if (!isUuid(deviceId)) {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: guest, error } = await admin
    .from('guests')
    .select('id, name')
    .eq('event_id', eventId)
    .eq('device_id', deviceId)
    .maybeSingle()

  if (error) {
    console.error(`[rol] resume(${eventId}) gagal:`, error.message)
    return NextResponse.json({ found: false }, { status: 500 })
  }

  if (!guest) {
    return NextResponse.json({ found: false })
  }

  const response = NextResponse.json({ found: true, name: guest.name })
  response.cookies.set(guestCookieName(eventId), guest.id, guestCookieOptions)
  return response
}
