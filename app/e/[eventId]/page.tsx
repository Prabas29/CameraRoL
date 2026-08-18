import { notFound, redirect } from 'next/navigation'

import { GuestJoinForm } from '@/components/guest-join-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicEvent } from '@/lib/events'
import { getFilmStyle } from '@/lib/film-styles'
import { getGuest } from '@/lib/guest-session'
import { formatRevealTime, isRevealed } from '@/lib/reveal'

export const metadata = { title: 'Gabung — Rol' }

export default async function JoinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  // Sudah pernah join dari perangkat ini? Langsung ke kamera.
  const guest = await getGuest(eventId)
  if (guest) redirect(`/e/${eventId}/camera`)

  const style = getFilmStyle(event.film_style)
  const revealed = isRevealed(event)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Kamu diundang ke</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{event.name}</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Isi namamu dulu</CardTitle>
          <CardDescription>
            Tanpa akun, tanpa instal apa pun. Foto-fotomu pakai film style{' '}
            <span className="text-foreground">{style.label}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuestJoinForm eventId={event.id} />
        </CardContent>
      </Card>

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        {revealed
          ? 'Album acara ini sudah dibuka — foto barumu akan langsung terlihat semua orang.'
          : event.reveal_at
            ? `Semua foto terkunci sampai ${formatRevealTime(event.reveal_at)}, lalu terbuka serentak.`
            : 'Semua foto terkunci sampai host membukanya, lalu terbuka serentak.'}
      </p>
    </main>
  )
}
