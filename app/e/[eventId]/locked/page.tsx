import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { LockedPanel } from '@/components/locked-panel'
import { Button } from '@/components/ui/button'
import { getPublicEvent } from '@/lib/events'
import { getGuest } from '@/lib/guest-session'
import { formatRevealTime, isRevealed } from '@/lib/reveal'

export const metadata = { title: 'Menunggu reveal — Rol' }

export default async function LockedPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  if (isRevealed(event)) redirect(`/e/${eventId}/gallery`)

  const guest = await getGuest(eventId)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">Album belum dibuka</p>
        <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
      </div>

      <LockedPanel revealAtIso={event.reveal_at} />

      <p className="max-w-sm text-sm text-muted-foreground">
        {event.reveal_at
          ? `Semua foto dari semua tamu terbuka serentak pada ${formatRevealTime(event.reveal_at)}.`
          : 'Semua foto dari semua tamu terbuka serentak begitu host menekan tombol buka.'}{' '}
        Sampai saat itu belum ada yang bisa melihatnya — termasuk kamu.
      </p>

      {guest ? (
        <Button asChild variant="secondary">
          <Link href={`/e/${eventId}/camera`}>Lanjut memotret</Link>
        </Button>
      ) : (
        <Button asChild variant="secondary">
          <Link href={`/e/${eventId}`}>Gabung & mulai memotret</Link>
        </Button>
      )}
    </main>
  )
}
