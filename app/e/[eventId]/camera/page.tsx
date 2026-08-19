import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { CameraCapture } from '@/components/camera-capture'
import { Button } from '@/components/ui/button'
import { canGuestUpload, isGuestRemoved } from '@/lib/access'
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
  const t = await getT()

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  const guest = await getGuest(eventId)
  if (!guest) redirect(`/e/${eventId}`)

  // Tamu yang dikeluarkan tidak dibawa ke kamera dengan tombol mati. Membuka
  // viewfinder untuk orang yang sudah tidak boleh ikut hanya menyisakan
  // pertanyaan; lebih jujur menyatakannya langsung.
  if (isGuestRemoved(guest)) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{t.camera.removedTitle}</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t.camera.removedBody}
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/">{t.notFound.home}</Link>
        </Button>
      </main>
    )
  }

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
