'use client'

import { useActionState, useState } from 'react'

import { createEvent, type ActionResult } from '@/app/dashboard/actions'
import { DateTimePicker } from '@/components/date-time-picker'
import { FilmStylePicker } from '@/components/film-style-picker'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FilmStyle, RevealMode } from '@/types/database'

const initialState: ActionResult = { error: null }

export function CreateEventForm() {
  const t = useT()
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

  const error = state.error
    ? (t.newEvent.errors[state.error as keyof typeof t.newEvent.errors] ??
      t.newEvent.errors.createFailed)
    : null

  return (
    <form action={formAction} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.newEvent.nameTitle}</CardTitle>
          <CardDescription>{t.newEvent.nameDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="name" className="sr-only">
            {t.newEvent.nameTitle}
          </Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            placeholder={t.newEvent.namePlaceholder}
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.newEvent.filmTitle}</CardTitle>
          <CardDescription>{t.newEvent.filmDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <input type="hidden" name="film_style" value={filmStyle} />
          <FilmStylePicker value={filmStyle} onChange={setFilmStyle} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.newEvent.revealTitle}</CardTitle>
          <CardDescription className="leading-relaxed">{t.newEvent.revealDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <input type="hidden" name="reveal_mode" value={revealMode} />
          <input type="hidden" name="reveal_at" value={scheduled ? revealIso : ''} />

          <div className="grid gap-3 sm:grid-cols-2">
            <ModeOption
              selected={scheduled}
              onSelect={() => setRevealMode('scheduled')}
              title={t.newEvent.modeScheduled}
              detail={t.newEvent.modeScheduledDetail}
            />
            <ModeOption
              selected={revealMode === 'manual'}
              onSelect={() => setRevealMode('manual')}
              title={t.newEvent.modeManual}
              detail={t.newEvent.modeManualDetail}
            />
          </div>

          {scheduled ? (
            <div className="grid gap-2">
              <Label htmlFor="reveal_at_picker">{t.newEvent.revealTimeLabel}</Label>
              <DateTimePicker
                id="reveal_at_picker"
                value={revealAt}
                onChange={setRevealAt}
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">{t.newEvent.timezoneNote}</p>
              {revealInPast ? (
                <p className="text-xs text-destructive">{t.newEvent.pastWarning}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <Button type="submit" size="lg" disabled={pending || revealInvalid}>
          {pending ? t.newEvent.submitting : t.newEvent.submit}
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
