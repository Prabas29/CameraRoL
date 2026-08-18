import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EventControls } from '@/components/event-controls'
import { HostPhotoGrid } from '@/components/host-photo-grid'
import { SharePanel } from '@/components/share-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { siteUrl } from '@/lib/env'
import { getI18n } from '@/lib/i18n/server'
import { signPhotoUrls } from '@/lib/photos'
import { isRevealed } from '@/lib/reveal'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, GalleryPhoto, GuestRow, PhotoRow } from '@/types/database'

interface PageProps {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { eventId } = await params
  const { created } = await searchParams

  const { t } = await getI18n()
  const supabase = await createClient()

  // RLS: query ini hanya mengembalikan baris kalau host yang login memang pemilik event.
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle<EventRow>()

  if (!event) notFound()

  const [{ data: guests }, { data: photoRows }] = await Promise.all([
    supabase.from('guests').select('*').eq('event_id', eventId).order('joined_at'),
    supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
  ])

  const guestList = (guests ?? []) as GuestRow[]
  const photoList = (photoRows ?? []) as PhotoRow[]
  const guestNames = new Map(guestList.map((guest) => [guest.id, guest.name]))

  // Host boleh melihat foto kapan saja, ini acaranya sendiri, dan dia butuh
  // ini untuk moderasi. Gerbang reveal hanya berlaku untuk tamu.
  const signedUrls = await signPhotoUrls(
    photoList.flatMap((photo) =>
      photo.thumb_storage_path
        ? [photo.filtered_storage_path, photo.thumb_storage_path]
        : [photo.filtered_storage_path],
    ),
  )

  const photos: GalleryPhoto[] = photoList.flatMap((photo) => {
    const url = signedUrls.get(photo.filtered_storage_path)
    if (!url) return []
    return [
      {
        id: photo.id,
        guestName: guestNames.get(photo.guest_id) ?? t.common.guest,
        createdAt: photo.created_at,
        url,
        thumbUrl: (photo.thumb_storage_path && signedUrls.get(photo.thumb_storage_path)) || url,
        filename: `${photo.id}.jpg`,
      },
    ]
  })

  const joinUrl = `${siteUrl()}/e/${event.id}`
  const revealed = isRevealed(event)

  return (
    <div className="grid gap-10">
      <div className="grid gap-2">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t.eventDetail.allEvents}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
          <Badge variant={revealed ? 'default' : 'secondary'}>
            {revealed ? t.dashboard.revealed : t.dashboard.locked}
          </Badge>
        </div>

        {created ? (
          <p className="text-sm text-primary">
            {t.eventDetail.created}
          </p>
        ) : null}
      </div>

      <SharePanel joinUrl={joinUrl} eventName={event.name} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t.eventDetail.statGuests} value={guestList.length} />
        <StatCard label={t.eventDetail.statPhotos} value={photoList.length} />
        <StatCard
          label={t.eventDetail.statAvg}
          value={guestList.length ? Math.round((photoList.length / guestList.length) * 10) / 10 : 0}
        />
      </div>

      <EventControls event={event} revealed={revealed} />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">{t.eventDetail.photosTitle(photos.length)}</CardTitle>
          {revealed ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/e/${event.id}/gallery`}>{t.eventDetail.viewGallery}</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <HostPhotoGrid eventId={event.id} photos={photos} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="grid gap-1 py-5">
        <span className="font-mono text-3xl font-semibold leading-none">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
