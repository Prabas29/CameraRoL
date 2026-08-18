'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { revealEvent, updateFilmStyle } from '@/app/dashboard/actions'
import { Countdown } from '@/components/countdown'
import { FilmStylePicker } from '@/components/film-style-picker'
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
        toast.error(result.error)
        return
      }
      toast.success('Film style diperbarui')
      router.refresh()
    })
  }

  function handleReveal() {
    startTransition(async () => {
      const result = await revealEvent(event.id)
      setConfirmOpen(false)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Foto sudah terbuka untuk semua tamu')
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>
            {revealed
              ? 'Semua tamu sudah bisa melihat dan mengunduh foto.'
              : 'Foto tersimpan aman dan belum bisa dilihat siapa pun kecuali kamu.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {!revealed && event.reveal_at ? (
            <div className="grid gap-2">
              <Countdown targetIso={event.reveal_at} onComplete={() => router.refresh()} />
              <p className="text-xs text-muted-foreground">
                Terbuka otomatis {formatRevealTime(event.reveal_at)}
              </p>
            </div>
          ) : null}

          {!revealed && !event.reveal_at ? (
            <p className="text-sm text-muted-foreground">
              Acara ini mode manual — foto terbuka begitu kamu menekan tombol di bawah.
            </p>
          ) : null}

          {!revealed ? (
            <div>
              <Button onClick={() => setConfirmOpen(true)} disabled={pending}>
                Buka foto sekarang
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Film style</CardTitle>
          <CardDescription>
            Berlaku untuk foto yang diambil setelah ini. Foto lama tetap memakai style saat
            dipotret — file mentahnya tersimpan, jadi bisa dirender ulang nanti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilmStylePicker value={filmStyle} onChange={handleStyleChange} disabled={pending} />
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka foto sekarang?</DialogTitle>
            <DialogDescription>
              Semua tamu langsung bisa melihat dan mengunduh seluruh foto di acara ini.
              Tindakan ini tidak bisa dibatalkan lewat aplikasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={handleReveal} disabled={pending}>
              {pending ? 'Membuka…' : 'Ya, buka sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
