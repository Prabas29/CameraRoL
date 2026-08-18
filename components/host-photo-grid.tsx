'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deletePhoto } from '@/app/dashboard/actions'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GalleryPhoto } from '@/types/database'

export function HostPhotoGrid({
  eventId,
  photos,
}: {
  eventId: string
  photos: GalleryPhoto[]
}) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [target, setTarget] = useState<GalleryPhoto | null>(null)

  if (photos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t.eventDetail.photosEmpty}
      </p>
    )
  }

  function handleDelete() {
    if (!target) return
    const photoId = target.id

    startTransition(async () => {
      const result = await deletePhoto(eventId, photoId)
      setTarget(null)
      if (result.error) {
        toast.error(t.newEvent.errors.createFailed)
        return
      }
      toast.success(t.eventDetail.deletedToast)
      router.refresh()
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <figure key={photo.id} className="group relative overflow-hidden rounded-2xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbUrl}
              alt={t.eventDetail.photoBy(photo.guestName)}
              className="aspect-square w-full object-cover"
              loading="lazy"
              decoding="async"
            />

            {/* Sengaja tetap gelap: label ini di atas foto, bukan di atas card. */}
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 text-xs text-white">
              {photo.guestName}
            </figcaption>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setTarget(photo)}
              className="absolute right-2 top-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              {t.eventDetail.deletePhoto}
            </Button>
          </figure>
        ))}
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.eventDetail.deleteTitle}</DialogTitle>
            <DialogDescription>
              {t.eventDetail.deleteDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? t.eventDetail.deleting : t.eventDetail.deletePhoto}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
