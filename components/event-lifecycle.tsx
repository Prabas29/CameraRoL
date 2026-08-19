'use client'

import { ArchiveIcon, ArchiveRestoreIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { archiveEvent, deleteEvent, unarchiveEvent } from '@/app/dashboard/actions'
import { useT } from '@/components/i18n-provider'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Akhir hidup sebuah acara: arsipkan, kembalikan, atau hapus permanen.
 *
 * Menghapus permanen sengaja hanya muncul SETELAH diarsipkan. Dua tahap membuat
 * tindakan yang tidak bisa dibatalkan tidak pernah berjarak satu ketukan dari
 * daftar acara, dan memberi host kesempatan mengunduh albumnya lebih dulu.
 */
export function EventLifecycle({
  eventId,
  eventName,
  archived,
  photoCount,
  guestCount,
}: {
  eventId: string
  eventName: string
  archived: boolean
  photoCount: number
  guestCount: number
}) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  function reportError(key: string) {
    toast.error(
      key === 'migrationNeeded'
        ? t.access.migrationNeeded
        : key === 'nameMismatch'
          ? t.eventDetail.nameMismatch
          : t.newEvent.errors.createFailed,
    )
  }

  function run(action: () => Promise<{ error: string | null }>, message: string, onDone?: () => void) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        reportError(result.error)
        return
      }
      onDone?.()
      toast.success(message)
      router.refresh()
    })
  }

  function confirmDelete() {
    startTransition(async () => {
      // deleteEvent memanggil redirect() saat berhasil, jadi jalur sukses tidak
      // pernah kembali ke sini. Yang sampai ke bawah hanyalah kegagalan.
      const result = await deleteEvent(eventId, confirmName)
      if (result?.error) reportError(result.error)
    })
  }

  return (
    <Card className={archived ? 'border-dashed' : undefined}>
      <CardHeader>
        <CardTitle className="text-base">{t.eventDetail.dangerTitle}</CardTitle>
        <CardDescription className="leading-relaxed">
          {archived ? t.eventDetail.archivedNotice : t.eventDetail.dangerDesc}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2">
        {archived ? (
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(() => unarchiveEvent(eventId), t.eventDetail.unarchivedToast)
              }
            >
              <ArchiveRestoreIcon />
              {t.eventDetail.unarchive}
            </Button>

            <Button variant="destructive" disabled={pending} onClick={() => setDeleteOpen(true)}>
              <Trash2Icon />
              {t.eventDetail.deleteEvent}
            </Button>
          </>
        ) : (
          <Button variant="secondary" disabled={pending} onClick={() => setArchiveOpen(true)}>
            <ArchiveIcon />
            {t.eventDetail.archive}
          </Button>
        )}
      </CardContent>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.eventDetail.archiveTitle}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {t.eventDetail.archiveDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveOpen(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(() => archiveEvent(eventId), t.eventDetail.archivedToast, () =>
                  setArchiveOpen(false),
                )
              }
            >
              {pending ? t.eventDetail.archiving : t.eventDetail.archive}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setConfirmName('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.eventDetail.deleteEventTitle}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {t.eventDetail.deleteEventDesc(photoCount, guestCount)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="confirm-name" className="text-xs text-muted-foreground">
              {t.eventDetail.deleteEventPrompt}
            </Label>
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(changeEvent) => setConfirmName(changeEvent.target.value)}
              placeholder={eventName}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              // Tombolnya baru hidup setelah namanya benar-benar cocok, jadi
              // menekan tanpa membaca tidak mungkin menghapus apa pun.
              disabled={pending || confirmName.trim() !== eventName}
              onClick={confirmDelete}
            >
              {pending ? t.eventDetail.deletingEvent : t.eventDetail.deleteEvent}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
