import { notFound, redirect } from 'next/navigation'

import { GuestJoinForm } from '@/components/guest-join-form'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicEvent } from '@/lib/events'
import { getFilmStyle } from '@/lib/film-styles'
import { getGuest } from '@/lib/guest-session'
import { getI18n } from '@/lib/i18n/server'
import { formatRevealTime, isRevealed } from '@/lib/reveal'

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t.meta.join }
}

export default async function JoinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const { locale, t } = await getI18n()

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  // Sudah pernah join dari perangkat ini? Langsung ke kamera.
  const guest = await getGuest(eventId)
  if (guest) redirect(`/e/${eventId}/camera`)

  const style = getFilmStyle(event.film_style)
  const revealed = isRevealed(event)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-6 px-6 py-12">
      <LanguageSwitcher />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t.join.invitedTo}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{event.name}</h1>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">{t.join.formTitle}</CardTitle>
          <CardDescription className="leading-relaxed">
            {t.join.formDescBefore}
            <span className="text-foreground">{t.filmStyles[style.id].label}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuestJoinForm eventId={event.id} />
        </CardContent>
      </Card>

      <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        {revealed
          ? t.join.noteRevealed
          : event.reveal_at
            ? t.join.noteScheduled(formatRevealTime(event.reveal_at, locale))
            : t.join.noteManual}
      </p>
    </main>
  )
}
