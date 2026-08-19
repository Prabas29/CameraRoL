import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPublicEvent } from '@/lib/events'
import { getGuest } from '@/lib/guest-session'
import { getEventGuests } from '@/lib/guests'
import { getI18n } from '@/lib/i18n/server'
import { formatRevealTime } from '@/lib/reveal'
import { cn } from '@/lib/utils'

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: `${t.guests.title} | ${t.common.appName}` }
}

export default async function GuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const { locale, t } = await getI18n()

  const event = await getPublicEvent(eventId)
  if (!event) notFound()

  // Daftar ini untuk peserta acara, bukan untuk siapa saja yang memegang link.
  // Tanpa gerbang ini, nama-nama tamu bisa dipanen orang luar hanya dengan
  // menebak URL.
  const me = await getGuest(eventId)
  if (!me) redirect(`/e/${eventId}`)

  const guests = await getEventGuests(eventId)

  return (
    <main className="mx-auto grid max-w-lg gap-6 px-5 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.guests.title}</h1>
          <p className="text-sm text-muted-foreground">{t.guests.subtitle(guests.length)}</p>
        </div>
        <LanguageSwitcher />
      </header>

      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t.guests.empty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {guests.map((guest) => {
            const isMe = guest.id === me.id

            return (
              <li
                key={guest.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-xs',
                  isMe && 'border-primary/50 ring-1 ring-primary/20',
                )}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {guest.name}
                    {isMe ? (
                      <span className="text-xs font-normal text-primary">{t.guests.you}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.guests.joinedAt(formatRevealTime(guest.joinedAt, locale))}
                  </p>
                </div>

                {/* Status "belum diizinkan" hanya ditampilkan pada diri
                    sendiri. Menempelkannya ke nama orang lain di daftar yang
                    dilihat seluruh tamu terasa seperti mempermalukan, padahal
                    yang perlu tahu alasannya cuma orang itu sendiri. */}
                {guest.canUpload ? (
                  <Badge variant="default">{t.guests.canUpload}</Badge>
                ) : isMe ? (
                  <Badge variant="secondary">{t.guests.cannotUpload}</Badge>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/e/${eventId}/camera`}>← {t.guests.backToCamera}</Link>
        </Button>
      </div>
    </main>
  )
}
