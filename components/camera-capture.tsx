'use client'

import { RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { capturePhoto } from '@/lib/bake-photo'
import { grainDataUri, type FilmStyleDef } from '@/lib/film-styles'
import { cn } from '@/lib/utils'

type CameraState = 'starting' | 'ready' | 'error'
type FacingMode = 'environment' | 'user'

interface CameraError {
  title: string
  detail: string
}

/** Menerjemahkan error getUserMedia jadi kalimat yang bisa ditindaklanjuti tamu. */
function describeError(error: unknown): CameraError {
  const name = error instanceof Error ? error.name : ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      title: 'Izin kamera ditolak',
      detail:
        'Buka pengaturan izin situs di browser, aktifkan kamera untuk halaman ini, lalu muat ulang.',
    }
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return {
      title: 'Kamera tidak ditemukan',
      detail: 'Perangkat ini sepertinya tidak punya kamera yang bisa dipakai browser.',
    }
  }
  if (name === 'NotReadableError') {
    return {
      title: 'Kamera sedang dipakai',
      detail: 'Tutup aplikasi lain yang memakai kamera, lalu muat ulang halaman ini.',
    }
  }
  return {
    title: 'Kamera gagal dinyalakan',
    detail: 'Coba muat ulang halaman. Kalau masih gagal, buka lewat browser lain.',
  }
}

export function CameraCapture({
  eventId,
  eventName,
  guestName,
  style,
}: {
  eventId: string
  eventName: string
  guestName: string
  style: FilmStyleDef
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<CameraState>('starting')
  const [error, setError] = useState<CameraError | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [portrait, setPortrait] = useState(true)
  const [busy, setBusy] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [shotCount, setShotCount] = useState(0)
  const [lastShot, setLastShot] = useState<string | null>(null)

  const mirrored = facingMode === 'user'

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false

    async function start() {
      setState('starting')
      setError(null)

      // getUserMedia hanya ada di secure context. Ini penyebab paling sering
      // orang bingung: membuka dev server lewat IP LAN (http://192.168.x.x)
      // tidak akan pernah bisa mengakses kamera.
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError({
          title: 'Kamera tidak tersedia di halaman ini',
          detail: window.isSecureContext
            ? 'Browser ini tidak mendukung akses kamera. Coba Chrome atau Safari versi terbaru.'
            : 'Kamera hanya bisa diakses lewat HTTPS atau localhost. Buka halaman ini dari alamat https://, bukan dari alamat IP.',
        })
        setState('error')
        return
      }

      stopStream()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1920 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        setState('ready')
      } catch (caught) {
        if (cancelled) return
        setError(describeError(caught))
        setState('error')
      }
    }

    void start()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [facingMode, stopStream])

  async function handleShutter() {
    const video = videoRef.current
    if (!video || state !== 'ready' || busy) return

    setBusy(true)
    setFlashing(true)
    window.setTimeout(() => setFlashing(false), 140)

    try {
      const photo = await capturePhoto(video, style, { mirrored })

      const body = new FormData()
      body.append('original', photo.original, 'original.jpg')
      body.append('filtered', photo.filtered, 'filtered.jpg')

      const response = await fetch(`/api/events/${eventId}/photos`, { method: 'POST', body })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        toast.error(payload.error ?? 'Foto gagal tersimpan. Coba lagi.')
        return
      }

      setShotCount((count) => count + 1)
      setLastShot(photo.previewUrl)
      toast.success('Tersimpan & terkunci')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Foto gagal diambil.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-black">
      <header className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{eventName}</p>
          <p className="truncate text-xs text-white/60">
            {guestName} · {style.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs tabular-nums">
            {shotCount} foto
          </span>
          {/* Gallery yang memutuskan: kalau belum waktunya, ia mengalihkan
              sendiri ke halaman tunggu berisi countdown. */}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={`/e/${eventId}/gallery`}>Album</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4">
        <div
          className={cn(
            'relative w-full max-w-md overflow-hidden rounded-xl bg-neutral-900',
            portrait ? 'aspect-[3/4]' : 'aspect-[4/3]',
          )}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            onLoadedMetadata={(loadEvent) => {
              const element = loadEvent.currentTarget
              setPortrait(element.videoHeight > element.videoWidth)
            }}
            className={cn(
              'size-full object-cover transition-opacity',
              state === 'ready' ? 'opacity-100' : 'opacity-0',
              mirrored && '-scale-x-100',
            )}
            style={{ filter: style.cssFilter }}
          />

          {/* Grain & vignette preview — pendekatan CSS dari efek yang nanti
              di-bake ke foto. Tidak identik piksel per piksel, tapi look-nya
              berasal dari angka yang sama di lib/film-styles.ts. */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{ backgroundImage: grainDataUri(), opacity: style.grainOpacity * 3 }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${style.vignetteStrength}) 100%)`,
            }}
          />

          {flashing ? <div className="absolute inset-0 bg-white" /> : null}

          {state === 'starting' ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              Menyalakan kamera…
            </p>
          ) : null}

          {state === 'error' && error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm font-medium text-white">{error.title}</p>
              <p className="text-xs text-white/60">{error.detail}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Muat ulang
              </Button>
            </div>
          ) : null}

          {lastShot ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lastShot}
              alt="Foto terakhir"
              className="absolute bottom-3 left-3 size-14 rounded-md border-2 border-white/70 object-cover"
            />
          ) : null}
        </div>
      </div>

      <footer className="grid gap-4 px-6 pb-8 pt-6">
        <div className="flex items-center justify-center gap-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ganti kamera depan/belakang"
            disabled={state !== 'ready' || busy}
            onClick={() => setFacingMode((mode) => (mode === 'environment' ? 'user' : 'environment'))}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCwIcon className="size-5" />
          </Button>

          <button
            type="button"
            onClick={handleShutter}
            disabled={state !== 'ready' || busy}
            aria-label="Ambil foto"
            className={cn(
              'size-20 rounded-full border-4 border-white/80 p-1.5 transition-transform',
              'disabled:opacity-40 active:scale-95',
            )}
          >
            <span
              className={cn(
                'block size-full rounded-full bg-primary transition-colors',
                busy && 'animate-pulse',
              )}
            />
          </button>

          {/* Penyeimbang lebar agar tombol shutter tetap di tengah. */}
          <span className="size-9" aria-hidden />
        </div>

        <p className="text-center text-xs text-white/50">
          {busy
            ? 'Menyimpan foto…'
            : 'Fotomu langsung terkunci. Belum ada yang bisa melihatnya, termasuk kamu.'}
        </p>
      </footer>
    </div>
  )
}
