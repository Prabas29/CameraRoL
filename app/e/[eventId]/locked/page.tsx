import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/components/language-switcher'
import { LockedPanel } from '@/components/locked-panel'
import { Button } from '@/components/ui/button'
import { getPublicEvent } from '@/lib/events'
import { getGuest } from '@/lib/guest-session'
import { getI18n } from '@/lib/i18n/server'
import { formatRevealTime, isRevealed } from '@/lib/reveal'

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t.meta.locked }
}

export default async function LockedPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const { locale, t } = await getI18n()

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  if (isRevealed(event)) redirect(`/e/${eventId}/gallery`)

  const guest = await getGuest(eventId)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <LanguageSwitcher />

      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">{t.locked.notOpenYet}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
      </div>

      <LockedPanel revealAtIso={event.reveal_at} />

      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {event.reveal_at
          ? t.locked.opensAt(formatRevealTime(event.reveal_at, locale))
          : t.locked.opensManual}{' '}
        {t.locked.untilThen}
      </p>

      <Button asChild variant="secondary">
        {guest ? (
          <Link href={`/e/${eventId}/camera`}>{t.locked.continueShooting}</Link>
        ) : (
          <Link href={`/e/${eventId}`}>{t.locked.joinAndShoot}</Link>
        )}
      </Button>
    </main>
  )
}
