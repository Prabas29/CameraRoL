import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getFilmStyle } from '@/lib/film-styles'
import { formatRevealTime, isRevealed } from '@/lib/reveal'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, EventStatsRow } from '@/types/database'

export const metadata = { title: 'Acara saya — Rol' }

export default async function DashboardPage() {
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Acara saya</h1>
          <p className="text-sm text-muted-foreground">
            Tiap acara punya satu QR yang bisa dipakai semua tamu.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">Buat acara</Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gagal memuat acara</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {eventList.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Belum ada acara</CardTitle>
            <CardDescription>
              Buat acara pertamamu, lalu bagikan QR-nya ke tamu. Foto mereka akan
              terkunci sampai waktu reveal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/new">Buat acara</Link>
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
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>
                        {item.reveal_mode === 'manual'
                          ? 'Dibuka manual oleh host'
                          : `Terbuka ${formatRevealTime(item.reveal_at!)}`}
                      </CardDescription>
                    </div>
                    <Badge variant={opened ? 'default' : 'secondary'}>
                      {opened ? 'Terbuka' : 'Terkunci'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>{stat?.guest_count ?? 0} tamu</span>
                  <span>{stat?.photo_count ?? 0} foto</span>
                  <span>{style.label}</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
