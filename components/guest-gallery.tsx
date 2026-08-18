'use client'

import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { GalleryPhoto } from '@/types/database'

/** Memicu unduhan dari sebuah Blob tanpa meninggalkan object URL menggantung. */
function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export function GuestGallery({
  photos,
  eventName,
}: {
  photos: GalleryPhoto[]
  eventName: string
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [zipping, setZipping] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)

  const active = activeIndex === null ? null : photos[activeIndex]

  const goPrevious = useCallback(() => {
    setActiveIndex((index) =>
      index === null ? null : (index - 1 + photos.length) % photos.length,
    )
  }, [photos.length])

  const goNext = useCallback(() => {
    setActiveIndex((index) => (index === null ? null : (index + 1) % photos.length))
  }, [photos.length])

  useEffect(() => {
    if (activeIndex === null) return

    function handleKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key === 'ArrowLeft') goPrevious()
      if (keyEvent.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeIndex, goPrevious, goNext])

  async function downloadOne(photo: GalleryPhoto) {
    try {
      const response = await fetch(photo.url)
      if (!response.ok) throw new Error()
      saveBlob(await response.blob(), photo.filename)
    } catch {
      toast.error('Gagal mengunduh foto. Coba lagi.')
    }
  }

  /**
   * ZIP dirakit di browser, bukan di server. Signed URL Supabase mengirim
   * `Access-Control-Allow-Origin: *` sehingga file bisa diambil langsung — dan
   * dengan begitu album ratusan foto tidak perlu melewati batas memori/waktu
   * fungsi serverless.
   */
  async function downloadAll() {
    if (zipping || photos.length === 0) return

    setZipping(true)
    setZipProgress(0)

    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      let done = 0
      for (const photo of photos) {
        const response = await fetch(photo.url)
        if (!response.ok) throw new Error(photo.filename)
        zip.file(photo.filename, await response.blob())
        done += 1
        setZipProgress(Math.round((done / photos.length) * 100))
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      saveBlob(blob, `rol-${slugify(eventName)}.zip`)
      toast.success(`${photos.length} foto diunduh`)
    } catch {
      toast.error('Gagal membuat ZIP. Coba unduh beberapa foto satu per satu.')
    } finally {
      setZipping(false)
      setZipProgress(0)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {photos.length} foto dari {countGuests(photos)} tamu
        </p>

        <Button onClick={downloadAll} disabled={zipping || photos.length === 0}>
          <DownloadIcon className="size-4" />
          {zipping ? `Menyiapkan… ${zipProgress}%` : 'Unduh semua (ZIP)'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative overflow-hidden rounded-lg border transition-colors hover:border-primary/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Foto oleh ${photo.guestName}`}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 text-left text-xs text-white">
              {photo.guestName}
            </span>
          </button>
        ))}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => !open && setActiveIndex(null)}
      >
        <DialogContent className="max-w-3xl gap-3 p-3 sm:p-4">
          {active ? (
            <>
              <DialogTitle className="sr-only">Foto oleh {active.guestName}</DialogTitle>

              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.url}
                  alt={`Foto oleh ${active.guestName}`}
                  className="max-h-[70svh] w-full rounded-md object-contain"
                />

                {photos.length > 1 ? (
                  <>
                    <NavButton side="left" onClick={goPrevious} />
                    <NavButton side="right" onClick={goNext} />
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{active.guestName}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {activeIndex! + 1} dari {photos.length}
                  </p>
                </div>

                <Button size="sm" variant="secondary" onClick={() => downloadOne(active)}>
                  <DownloadIcon className="size-4" />
                  Unduh
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Foto sebelumnya' : 'Foto berikutnya'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70',
        side === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}

function countGuests(photos: GalleryPhoto[]): number {
  return new Set(photos.map((photo) => photo.guestName)).size
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'acara'
  )
}
