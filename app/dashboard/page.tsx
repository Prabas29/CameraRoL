import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getFilmStyle } from '@/lib/film-styles'
import { getI18n } from '@/lib/i18n/server'
import { formatRevealTime, isRevealed } from '@/lib/reveal'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, EventStatsRow } from '@/types/database'

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t.meta.dashboard }
}

export default async function DashboardPage() {
  const { locale, t } = await getI18n()
  const supabase = await createClient()

  // RLS membatasi hasilnya ke event milik host yang sedang login.
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  const eventList = (events ?? []) as EventRow[]

  const { data: stats } = eventList.length
    ? await supabase
        .from('event_stats')
        .select('*')
        .in('event_id', eventList.map((item) => item.id))
    : { data: [] as EventStatsRow[] }

  const statsByEvent = new Map<string, EventStatsRow>(
    ((stats ?? []) as EventStatsRow[]).map((row) => [row.event_id, row]),
  )

  return (
    <div className="grid gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">{t.dashboard.create}</Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.loadFailed}</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {eventList.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.emptyTitle}</CardTitle>
            <CardDescription className="leading-relaxed">{t.dashboard.emptyBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/new">{t.dashboard.create}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {eventList.map((item) => {
          const stat = statsByEvent.get(item.id)
          const opened = isRevealed(item)
          const style = getFilmStyle(item.film_style)

          return (
            <Link key={item.id} href={`/dashboard/${item.id}`} className="group">
              <Card className="transition-all group-hover:shadow-md group-hover:ring-primary/40">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>
                        {item.reveal_mode === 'manual'
                          ? t.dashboard.manualReveal
                          : t.dashboard.opensAt(formatRevealTime(item.reveal_at!, locale))}
                      </CardDescription>
                    </div>
                    <Badge variant={opened ? 'default' : 'secondary'}>
                      {opened ? t.dashboard.revealed : t.dashboard.locked}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>{t.dashboard.guestCount(stat?.guest_count ?? 0)}</span>
                  <span>{t.dashboard.photoCount(stat?.photo_count ?? 0)}</span>
                  <span>{t.filmStyles[style.id].label}</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
