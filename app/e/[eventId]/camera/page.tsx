import { notFound, redirect } from 'next/navigation'

import { CameraCapture } from '@/components/camera-capture'
import { canGuestUpload } from '@/lib/access'
import { getPublicEvent } from '@/lib/events'
import { getFilmStyle } from '@/lib/film-styles'
import { getGuest } from '@/lib/guest-session'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t.meta.camera }
}

export default async function CameraPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  const guest = await getGuest(eventId)
  if (!guest) redirect(`/e/${eventId}`)

  return (
    <CameraCapture
      eventId={event.id}
      eventName={event.name}
      guestName={guest.name}
      style={getFilmStyle(event.film_style)}
      canUpload={canGuestUpload(guest)}
    />
  )
}
