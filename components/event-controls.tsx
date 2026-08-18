'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { revealEvent, updateFilmStyle } from '@/app/dashboard/actions'
import { Countdown } from '@/components/countdown'
import { FilmStylePicker } from '@/components/film-style-picker'
import { useI18n } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatRevealTime } from '@/lib/reveal'
import type { EventRow, FilmStyle } from '@/types/database'

export function EventControls({
  event,
  revealed,
}: {
  event: EventRow
  revealed: boolean
}) {
  const { locale, t } = useI18n()

  // Server action mengembalikan KUNCI pesan, bukan kalimat jadi, supaya teksnya
  // bisa mengikuti bahasa yang sedang aktif.
  const actionError = (key: string) =>
    t.newEvent.errors[key as keyof typeof t.newEvent.errors] ?? t.newEvent.errors.createFailed
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [filmStyle, setFilmStyle] = useState<FilmStyle>(event.film_style)

  function handleStyleChange(next: FilmStyle) {
    const previous = filmStyle
    setFilmStyle(next)

    startTransition(async () => {
      const result = await updateFilmStyle(event.id, next)
      if (result.error) {
        setFilmStyle(previous)
        toast.error(actionError(result.error))
        return
      }
      toast.success(t.eventDetail.styleUpdated)
      router.refresh()
    })
  }

  function handleReveal() {
    startTransition(async () => {
      const result = await revealEvent(event.id)
      setConfirmOpen(false)
      if (result.error) {
        toast.error(actionError(result.error))
        return
      }
      toast.success(t.eventDetail.openedToast)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.eventDetail.statusTitle}</CardTitle>
          <CardDescription>
            {revealed
              ? t.eventDetail.statusRevealed
              : t.eventDetail.statusLocked}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {!revealed && event.reveal_at ? (
            <div className="grid gap-2">
              <Countdown targetIso={event.reveal_at} onComplete={() => router.refresh()} />
              <p className="text-xs text-muted-foreground">
                {t.eventDetail.autoOpenAt(formatRevealTime(event.reveal_at, locale))}
              </p>
            </div>
          ) : null}

          {!revealed && !event.reveal_at ? (
            <p className="text-sm text-muted-foreground">
              {t.eventDetail.manualNote}
            </p>
          ) : null}

          {!revealed ? (
            <div>
              <Button onClick={() => setConfirmOpen(true)} disabled={pending}>
                {t.eventDetail.openNow}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.eventDetail.filmTitle}</CardTitle>
          <CardDescription>
            {t.eventDetail.filmDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilmStylePicker value={filmStyle} onChange={handleStyleChange} disabled={pending} />
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.eventDetail.confirmTitle}</DialogTitle>
            <DialogDescription>
              {t.eventDetail.confirmDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleReveal} disabled={pending}>
              {pending ? t.eventDetail.opening : t.eventDetail.confirmYes}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
