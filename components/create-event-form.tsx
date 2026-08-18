'use client'

import { useActionState, useState } from 'react'

import { createEvent, type ActionResult } from '@/app/dashboard/actions'
import { DateTimePicker } from '@/components/date-time-picker'
import { FilmStylePicker } from '@/components/film-style-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FilmStyle, RevealMode } from '@/types/database'

const initialState: ActionResult = { error: null }

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState)

  const [filmStyle, setFilmStyle] = useState<FilmStyle>('vintage')
  const [revealMode, setRevealMode] = useState<RevealMode>('scheduled')
  const [revealAt, setRevealAt] = useState<Date | undefined>(undefined)

  // Picker bekerja di zona waktu perangkat host. Konversi ke ISO dilakukan di
  // browser supaya yang tersimpan adalah momen absolut sesuai zona waktu host —
  // bukan zona waktu server (yang di Vercel selalu UTC).
  const revealIso = revealAt ? revealAt.toISOString() : ''

  const scheduled = revealMode === 'scheduled'
  const revealInPast = revealAt !== undefined && revealAt.getTime() <= Date.now()
  const revealInvalid = scheduled && (revealAt === undefined || revealInPast)

  return (
    <form action={formAction} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nama acara</CardTitle>
          <CardDescription>Ini yang dilihat tamu saat membuka link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="name" className="sr-only">
            Nama acara
          </Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            placeholder="Nikahan Dina & Raka"
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Film style</CardTitle>
          <CardDescription>
            Semua foto di acara ini pakai tampilan yang sama. Bisa diganti nanti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input type="hidden" name="film_style" value={filmStyle} />
          <FilmStylePicker value={filmStyle} onChange={setFilmStyle} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kapan foto dibuka</CardTitle>
          <CardDescription>
            Sebelum waktu ini, tamu tidak bisa melihat foto siapa pun — termasuk fotonya sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <input type="hidden" name="reveal_mode" value={revealMode} />
          <input type="hidden" name="reveal_at" value={scheduled ? revealIso : ''} />

          <div className="grid gap-2 sm:grid-cols-2">
            <ModeOption
              selected={scheduled}
              onSelect={() => setRevealMode('scheduled')}
              title="Terjadwal"
              detail="Terbuka sendiri di waktu yang kamu tentukan."
            />
            <ModeOption
              selected={revealMode === 'manual'}
              onSelect={() => setRevealMode('manual')}
              title="Manual"
              detail="Kamu yang menekan tombol buka, kapan pun."
            />
          </div>

          {scheduled ? (
            <div className="grid gap-2">
              <Label htmlFor="reveal_at_picker">Waktu reveal</Label>
              <DateTimePicker
                id="reveal_at_picker"
                value={revealAt}
                onChange={setRevealAt}
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">
                Mengikuti zona waktu perangkat ini.
              </p>
              {revealInPast ? (
                <p className="text-xs text-destructive">
                  Waktu reveal sudah lewat. Pilih waktu di masa depan.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div>
        <Button type="submit" size="lg" disabled={pending || revealInvalid}>
          {pending ? 'Membuat…' : 'Buat acara & ambil QR'}
        </Button>
      </div>
    </form>
  )
}

function ModeOption({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'rounded-2xl border bg-card p-5 text-left shadow-xs transition-all',
        selected
          ? 'border-primary bg-primary/8 shadow-sm ring-2 ring-primary/25'
          : 'hover:border-muted-foreground/30 hover:shadow-sm',
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
    </button>
  )
}
