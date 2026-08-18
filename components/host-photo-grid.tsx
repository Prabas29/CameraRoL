'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deletePhoto } from '@/app/dashboard/actions'
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
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [target, setTarget] = useState<GalleryPhoto | null>(null)

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Belum ada foto masuk. Foto akan muncul di sini begitu tamu mulai memotret.
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
        toast.error(result.error)
        return
      }
      toast.success('Foto dihapus')
      router.refresh()
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <figure key={photo.id} className="group relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Foto oleh ${photo.guestName}`}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />

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
              Hapus
            </Button>
          </figure>
        ))}
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus foto ini?</DialogTitle>
            <DialogDescription>
              Foto tidak akan muncul di gallery tamu. File aslinya tetap tersimpan di storage,
              jadi masih bisa dipulihkan lewat database kalau salah hapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={pending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? 'Menghapus…' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
