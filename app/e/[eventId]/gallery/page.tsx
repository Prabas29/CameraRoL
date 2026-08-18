import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { GuestGallery } from '@/components/guest-gallery'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { getPublicEvent } from '@/lib/events'
import { getRevealedPhotos } from '@/lib/gallery'
import { getGuest } from '@/lib/guest-session'
import { getT } from '@/lib/i18n/server'
import { isRevealed } from '@/lib/reveal'

export async function generateMetadata() {
  const t = await getT()
  return { title: t.meta.gallery }
}

export default async function GalleryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const t = await getT()

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  // Gerbangnya di server. Kalau belum waktunya, halaman ini tidak pernah
  // sempat memanggil getRevealedPhotos() sama sekali.
  if (!isRevealed(event)) redirect(`/e/${eventId}/locked`)

  const [photos, guest] = await Promise.all([getRevealedPhotos(event, t.common.guest), getGuest(eventId)])

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">{t.gallery.openAlbum}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
        </div>
        <LanguageSwitcher />
      </header>

      {photos.length === 0 ? (
        <div className="grid gap-4 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">{t.gallery.emptyBody}</p>
          <div>
            <Button asChild variant="secondary">
              <Link href={`/e/${eventId}${guest ? '/camera' : ''}`}>
                {guest ? t.gallery.firstPhoto : t.gallery.joinAndShoot}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <GuestGallery photos={photos} eventName={event.name} />
      )}

      {guest && photos.length > 0 ? (
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/e/${eventId}/camera`}>← {t.gallery.backToCamera}</Link>
          </Button>
        </div>
      ) : null}
    </main>
  )
}
