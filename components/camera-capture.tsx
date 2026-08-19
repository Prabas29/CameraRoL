'use client'

import { RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { capturePhoto } from '@/lib/bake-photo'
import { grainDataUri, type FilmStyleDef } from '@/lib/film-styles'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

/**
 * Batas zoom digital.
 *
 * 5x sudah terlalu jauh untuk sensor ponsel: gambarnya lebih banyak berisi
 * hasil interpolasi daripada detail nyata, dan foto acara yang lembek tidak ada
 * gunanya. Zoom optik lewat pergantian lensa tidak terkena batas ini.
 */
const MAX_DIGITAL_ZOOM = 5

type CameraState = 'starting' | 'ready' | 'error'
type FacingMode = 'environment' | 'user'
type CameraErrorCopy = Dictionary['camera']['errors']

interface CameraError {
  title: string
  detail: string
}

/** Menerjemahkan error getUserMedia jadi kalimat yang bisa ditindaklanjuti tamu. */
function describeError(error: unknown, copy: CameraErrorCopy): CameraError {
  const name = error instanceof Error ? error.name : ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return { title: copy.deniedTitle, detail: copy.deniedDetail }
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return { title: copy.notFoundTitle, detail: copy.notFoundDetail }
  }
  if (name === 'NotReadableError') {
    return { title: copy.inUseTitle, detail: copy.inUseDetail }
  }
  return { title: copy.genericTitle, detail: copy.genericDetail }
}

/**
 * Mengelompokkan kamera belakang berdasarkan perannya.
 *
 * Label dari enumerateDevices tidak seragam: Android sering menulis
 * "camera2 0, facing back", iOS menulis "Back Ultra Wide Camera". Yang bisa
 * diandalkan cuma kata kuncinya. Kalau tidak ada yang cocok, kamera pertama
 * dianggap kamera utama supaya tombol 1x tetap berfungsi.
 */
function groupLenses(devices: MediaDeviceInfo[]) {
  const has = (device: MediaDeviceInfo, keyword: string) =>
    device.label.toLowerCase().includes(keyword)

  const ultraWide = devices.find((device) => has(device, 'ultra')) ?? null
  const tele = devices.find((device) => has(device, 'tele')) ?? null
  const main =
    devices.find(
      (device) => device !== ultraWide && device !== tele && has(device, 'wide'),
    ) ??
    devices.find((device) => device !== ultraWide && device !== tele) ??
    null

  return { ultraWide, main, tele }
}

/**
 * Menebak apakah sebuah kamera menghadap ke pengguna.
 *
 * Hanya lewat label, karena facingMode sebenarnya cuma bisa dibaca dari track
 * yang sudah menyala, sementara daftar ini berisi kamera yang belum dinyalakan.
 * Perangkat yang labelnya tidak menyebut arah dianggap kamera belakang, supaya
 * jatuhnya ke daftar yang tampil dan bukan disembunyikan diam-diam.
 */
function isFrontLens(device: MediaDeviceInfo): boolean {
  const label = device.label.toLowerCase()
  return label.includes('front') || label.includes('user')
}

export function CameraCapture({
  eventId,
  eventName,
  guestName,
  style,
  canUpload,
}: {
  eventId: string
  eventName: string
  guestName: string
  style: FilmStyleDef
  /** Ditegakkan lagi di server; di sini hanya untuk menonaktifkan shutter. */
  canUpload: boolean
}) {
  const { locale, t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<CameraState>('starting')
  const [error, setError] = useState<CameraError | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [mirrored, setMirrored] = useState(false)
  const [activeFront, setActiveFront] = useState(false)
  const [zoom, setZoom] = useState(1)
  const frameRef = useRef<HTMLDivElement>(null)

  // Zoom disimpan juga di ref supaya listener sentuh tidak perlu dipasang ulang
  // setiap kali angkanya berubah. Memasang ulang di tengah cubitan akan
  // memutus gerakannya.
  const zoomRef = useRef(1)
  zoomRef.current = zoom

  // Zoom yang harus berlaku SETELAH stream berikutnya siap.
  //
  // Berpindah lensa memasang ulang stream, dan efeknya mengembalikan zoom ke 1.
  // Tanpa penampung ini, preset yang butuh ganti lensa sekaligus zoom digital
  // (2x pada perangkat tanpa telefoto) akan kehilangan zoom-nya begitu stream
  // baru menyala.
  const pendingZoomRef = useRef<number | null>(null)
  const [portrait, setPortrait] = useState(true)
  const [busy, setBusy] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [shotCount, setShotCount] = useState(0)
  const [lastShot, setLastShot] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  // Kamus disimpan di ref, bukan jadi dependency efek. Kalau ikut jadi
  // dependency, mengganti bahasa akan memasang ulang kamera di tengah sesi,
  // dan di sebagian browser itu memunculkan permintaan izin lagi.
  const errorCopyRef = useRef(t.camera.errors)
  errorCopyRef.current = t.camera.errors

  useEffect(() => {
    let cancelled = false

    async function start() {
      setState('starting')
      setError(null)

      const copy = errorCopyRef.current

      // getUserMedia hanya ada di secure context. Ini penyebab paling sering
      // orang bingung: membuka dev server lewat IP LAN (http://192.168.x.x)
      // tidak akan pernah bisa mengakses kamera.
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError({
          title: copy.unavailableTitle,
          detail: window.isSecureContext ? copy.unsupportedDetail : copy.insecureDetail,
        })
        setState('error')
        return
      }

      stopStream()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            // Kalau modul tertentu dipilih, `deviceId` yang menentukan dan
            // `facingMode` justru harus absen: dua-duanya bisa saling
            // bertentangan dan membuat constraint gagal.
            ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode }),
            // Ideal, bukan exact: browser memilih mode terdekat yang tersedia
            // dan tidak gagal kalau perangkatnya tidak sanggup.
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        setZoom(pendingZoomRef.current ?? 1)
        pendingZoomRef.current = null

        // Arah kamera dibaca dari track yang benar-benar aktif, bukan dari
        // tebakan kita. Saat modul dipilih lewat deviceId, state facingMode
        // tidak lagi mencerminkan kamera mana yang menyala.
        const settings = stream.getVideoTracks()[0]?.getSettings()
        const front = settings?.facingMode ? settings.facingMode === 'user' : facingMode === 'user'
        setMirrored(front)
        setActiveFront(front)

        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        setState('ready')

        // Baru dipanggil setelah izin diberikan: sebelum itu label perangkat
        // dikosongkan browser demi privasi, sehingga daftarnya tidak berguna.
        const all = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) setDevices(all.filter((d) => d.kind === 'videoinput'))
      } catch (caught) {
        if (cancelled) return
        setError(describeError(caught, copy))
        setState('error')
      }
    }

    void start()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [facingMode, deviceId, stopStream])

  async function handleShutter() {
    const video = videoRef.current
    if (!video || state !== 'ready' || busy || !canUpload) return

    setBusy(true)
    setFlashing(true)
    window.setTimeout(() => setFlashing(false), 140)

    try {
      const photo = await capturePhoto(video, style, { mirrored, zoom })

      const body = new FormData()
      body.append('original', photo.original, 'original.jpg')
      body.append('filtered', photo.filtered, 'filtered.jpg')
      body.append('thumbnail', photo.thumbnail, 'thumbnail.jpg')

      const response = await fetch(`/api/events/${eventId}/photos`, { method: 'POST', body })

      if (!response.ok) {
        toast.error(t.camera.saveFailedToast)
        URL.revokeObjectURL(photo.previewUrl)
        return
      }

      setShotCount((count) => count + 1)
      // previewUrl adalah object URL; lepaskan yang lama supaya blob-nya tidak
      // menumpuk di memori sepanjang sesi memotret.
      setLastShot((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return photo.previewUrl
      })
      toast.success(t.camera.savedToast)
    } catch {
      toast.error(t.camera.captureFailed)
    } finally {
      setBusy(false)
    }
  }

  /**
   * Pinch to zoom, dipasang sebagai listener native, bukan lewat prop onTouch*.
   *
   * Dua alasan. Pertama, React memasang touchmove sebagai listener PASIF,
   * sehingga preventDefault di dalamnya diabaikan browser. Kedua, Safari iOS
   * memicu zoom halaman lewat rangkaian gesture event yang terpisah sama sekali
   * dari touch event; tanpa dicegah, mencubit akan memperbesar seluruh
   * antarmuka alih-alih gambar kameranya.
   */
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    let pinch: { distance: number; zoom: number } | null = null

    // Rasio renggang jari, bukan selisih piksel, supaya terasa sama di layar
    // besar maupun kecil.
    const spread = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      )

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      pinch = { distance: spread(event.touches), zoom: zoomRef.current }
    }

    const onMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return
      event.preventDefault()

      const ratio = spread(event.touches) / pinch.distance
      setZoom(Math.min(MAX_DIGITAL_ZOOM, Math.max(1, pinch.zoom * ratio)))
    }

    const onEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null
    }

    const blockPageZoom = (event: Event) => event.preventDefault()

    frame.addEventListener('touchstart', onStart, { passive: false })
    frame.addEventListener('touchmove', onMove, { passive: false })
    frame.addEventListener('touchend', onEnd)
    frame.addEventListener('touchcancel', onEnd)
    frame.addEventListener('gesturestart', blockPageZoom, { passive: false })
    frame.addEventListener('gesturechange', blockPageZoom, { passive: false })

    return () => {
      frame.removeEventListener('touchstart', onStart)
      frame.removeEventListener('touchmove', onMove)
      frame.removeEventListener('touchend', onEnd)
      frame.removeEventListener('touchcancel', onEnd)
      frame.removeEventListener('gesturestart', blockPageZoom)
      frame.removeEventListener('gesturechange', blockPageZoom)
    }
  }, [])

  function flipCamera() {
    // Balik ke pemilihan berbasis facingMode; deviceId dilepas supaya tidak
    // mengunci kamera lama.
    setDeviceId(null)
    setFacingMode((mode) => (mode === 'environment' ? 'user' : 'environment'))
  }

  const activeDeviceId =
    deviceId ?? streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId ?? null

  // Hanya modul di sisi yang sedang aktif. Berpindah depan/belakang sudah
  // tugas tombol balik di sebelahnya.
  const lenses = devices.filter((device) => isFrontLens(device) === activeFront)
  const { ultraWide, main, tele } = groupLenses(lenses)

  /**
   * Preset zoom, meniru kamera bawaan.
   *
   * 0,5x dan 2x memakai lensa fisik kalau perangkatnya punya, karena itu zoom
   * optik yang tidak kehilangan detail. Kalau tidak punya, 2x jatuh ke zoom
   * digital pada lensa utama; 0,5x tidak ditampilkan sama sekali karena tidak
   * ada cara memperlebar sudut pandang secara digital.
   */
  const presets: { factor: number; deviceId: string | null; digital: number }[] = [
    ...(ultraWide ? [{ factor: 0.5, deviceId: ultraWide.deviceId, digital: 1 }] : []),
    { factor: 1, deviceId: main?.deviceId ?? null, digital: 1 },
    tele
      ? { factor: 2, deviceId: tele.deviceId, digital: 1 }
      : { factor: 2, deviceId: main?.deviceId ?? null, digital: 2 },
  ]

  const activePresetIndex = presets.findIndex(
    (preset) =>
      (preset.deviceId ?? activeDeviceId) === activeDeviceId &&
      Math.abs(preset.digital - zoom) < 0.05,
  )

  const zoomFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })

  function applyPreset(preset: { deviceId: string | null; digital: number }) {
    if (preset.deviceId && preset.deviceId !== activeDeviceId) {
      pendingZoomRef.current = preset.digital
      setDeviceId(preset.deviceId)
      return
    }
    setZoom(preset.digital)
  }

  const showZoomBar = presets.length > 1 && state === 'ready'

  return (
    <div className="flex min-h-svh flex-col bg-black">
      <header className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{eventName}</p>
          <p className="truncate text-xs text-white/60">
            {guestName} · {t.filmStyles[style.id].label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs tabular-nums">
            {t.camera.photoCount(shotCount)}
          </span>
          {/* Gallery yang memutuskan: kalau belum waktunya, ia mengalihkan
              sendiri ke halaman tunggu berisi countdown. */}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={`/e/${eventId}/gallery`}>{t.camera.album}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={`/e/${eventId}/guests`}>{t.guests.viewAll}</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4">
        <div
          ref={frameRef}
          // touch-none memberi tahu browser bahwa gerakan di area ini ditangani
          // sendiri, sehingga tidak ditafsirkan sebagai gulir atau zoom halaman.
          className={cn(
            'relative w-full max-w-md touch-none overflow-hidden rounded-2xl bg-neutral-900',
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
            )}
            style={{
              filter: style.cssFilter,
              // Cermin dan zoom digabung dalam satu transform. Kalau cermin
              // tetap lewat class -scale-x-100, transform di sini akan
              // menimpanya dan kamera depan berhenti tercermin.
              transform: `scale(${mirrored ? -zoom : zoom}, ${zoom})`,
            }}
          />

          {/* Grain & vignette preview, pendekatan CSS dari efek yang nanti
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

          {state === 'ready' && zoom > 1.02 ? (
            <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs tabular-nums text-white">
              {zoomFormatter.format(zoom)}×
            </span>
          ) : null}

          {flashing ? <div className="absolute inset-0 bg-white" /> : null}

          {state === 'starting' ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              {t.camera.starting}
            </p>
          ) : null}

          {state === 'error' && error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm font-medium text-white">{error.title}</p>
              <p className="text-xs leading-relaxed text-white/60">{error.detail}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                {t.camera.reload}
              </Button>
            </div>
          ) : null}

          {lastShot ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lastShot}
              alt={t.camera.lastPhoto}
              className="absolute bottom-3 left-3 size-14 rounded-lg border-2 border-white/70 object-cover"
            />
          ) : null}
        </div>
      </div>

      <footer className="grid gap-4 px-6 pb-8 pt-5">
        {showZoomBar ? (
          <div
            role="group"
            aria-label={t.camera.chooseZoom}
            className="mx-auto flex items-center gap-1 rounded-full bg-black/50 p-1"
          >
            {presets.map((preset, index) => {
              const isActive = index === activePresetIndex
              // Preset yang aktif menampilkan zoom sebenarnya, jadi saat dicubit
              // angkanya ikut bergerak alih-alih diam di 1x sementara gambarnya
              // jelas sudah membesar.
              const label = isActive
                ? zoomFormatter.format(zoom)
                : zoomFormatter.format(preset.factor)

              return (
                <button
                  key={preset.factor}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  disabled={busy}
                  aria-pressed={isActive}
                  className={cn(
                    'min-w-11 rounded-full px-2 py-2 text-xs font-semibold tabular-nums transition-colors disabled:opacity-40',
                    isActive ? 'bg-white/25 text-primary' : 'text-white/80 hover:text-white',
                  )}
                >
                  {label}
                  {isActive ? '×' : ''}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.camera.switchCamera}
            disabled={state !== 'ready' || busy}
            onClick={flipCamera}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCwIcon className="size-5" />
          </Button>

          <button
            type="button"
            onClick={handleShutter}
            disabled={state !== 'ready' || busy || !canUpload}
            aria-label={t.camera.shutter}
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
          <span className="size-10" aria-hidden />
        </div>

        <p className="text-center text-xs leading-relaxed text-white/50">
          {!canUpload ? t.camera.notAllowed : busy ? t.camera.saving : t.camera.lockedNote}
        </p>
      </footer>
    </div>
  )
}
