'use client'

import type { FilmStyleDef } from '@/lib/film-styles'

/** Sisi terpanjang foto hasil. Cukup tajam untuk dicetak kecil, ringan diunggah. */
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.9

/**
 * Thumbnail untuk grid gallery. Petak di grid tidak pernah lebih lebar dari
 * ~300 px, jadi 480 px masih tajam di layar retina sekalipun. Kualitas boleh
 * lebih rendah karena file ini tidak pernah dilihat besar-besar — lightbox dan
 * unduhan tetap memakai versi penuh.
 */
const THUMB_EDGE = 480
const THUMB_QUALITY = 0.72

const GRAIN_TILE = 128

export interface CapturedPhoto {
  /** Frame mentah tanpa filter — arsip untuk render ulang di kemudian hari. */
  original: Blob
  /** Frame yang filternya sudah di-bake — dipakai lightbox & unduhan. */
  filtered: Blob
  /** Versi kecil dari `filtered`, khusus grid gallery. */
  thumbnail: Blob
  /**
   * Object URL dari thumbnail, untuk umpan balik langsung di layar.
   * Pemanggil bertanggung jawab memanggil URL.revokeObjectURL() setelah selesai.
   */
  previewUrl: string
}

/**
 * Menghitung potongan tengah dengan rasio 4:3 (atau 3:4 kalau sumbernya potret).
 * Rasio ditentukan dari orientasi video supaya hasil di HP dan laptop sama-sama
 * wajar, dan cocok dengan bingkai preview yang memakai `object-cover`.
 */
function cropRect(sourceWidth: number, sourceHeight: number) {
  const portrait = sourceHeight > sourceWidth
  const targetRatio = portrait ? 3 / 4 : 4 / 3
  const sourceRatio = sourceWidth / sourceHeight

  let width = sourceWidth
  let height = sourceHeight

  if (sourceRatio > targetRatio) {
    width = sourceHeight * targetRatio
  } else {
    height = sourceWidth / targetRatio
  }

  return {
    sx: (sourceWidth - width) / 2,
    sy: (sourceHeight - height) / 2,
    sw: width,
    sh: height,
    portrait,
  }
}

/** Ubin noise kecil, dipakai ulang sebagai pattern supaya tidak per-piksel. */
function createGrainTile(): HTMLCanvasElement {
  const tile = document.createElement('canvas')
  tile.width = GRAIN_TILE
  tile.height = GRAIN_TILE

  const context = tile.getContext('2d')!
  const image = context.createImageData(GRAIN_TILE, GRAIN_TILE)

  for (let index = 0; index < image.data.length; index += 4) {
    const value = 120 + Math.random() * 135
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }

  context.putImageData(image, 0, 0)
  return tile
}

function drawGrain(context: CanvasRenderingContext2D, width: number, height: number, opacity: number) {
  if (opacity <= 0) return

  const pattern = context.createPattern(createGrainTile(), 'repeat')
  if (!pattern) return

  context.save()
  context.globalAlpha = opacity
  context.globalCompositeOperation = 'overlay'
  context.fillStyle = pattern
  context.fillRect(0, 0, width, height)
  context.restore()
}

function drawVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number,
) {
  if (strength <= 0) return

  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`)

  context.save()
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  context.restore()
}

function toBlob(canvas: HTMLCanvasElement, quality: number = JPEG_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal mengubah foto jadi file.'))),
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Mengecilkan hasil bake jadi thumbnail.
 *
 * Sumbernya canvas yang filternya sudah diterapkan, bukan video mentah, supaya
 * thumbnail dan versi penuh benar-benar memperlihatkan look yang sama.
 */
function makeThumbnail(source: HTMLCanvasElement): HTMLCanvasElement {
  const scale = Math.min(1, THUMB_EDGE / Math.max(source.width, source.height))
  const thumb = document.createElement('canvas')
  thumb.width = Math.max(1, Math.round(source.width * scale))
  thumb.height = Math.max(1, Math.round(source.height * scale))

  const context = thumb.getContext('2d')!
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, thumb.width, thumb.height)

  return thumb
}

/**
 * Mengambil satu frame dari <video> dan menghasilkan dua file JPEG.
 *
 * Filter warnanya memakai `cssFilter` yang sama persis dengan live preview, jadi
 * hasil foto tidak bisa melenceng dari yang dilihat tamu di layar.
 */
export async function capturePhoto(
  video: HTMLVideoElement,
  style: FilmStyleDef,
  { mirrored = false }: { mirrored?: boolean } = {},
): Promise<CapturedPhoto> {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Kamera belum siap.')
  }

  const { sx, sy, sw, sh } = cropRect(sourceWidth, sourceHeight)
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh))
  const width = Math.round(sw * scale)
  const height = Math.round(sh * scale)

  function drawFrame(context: CanvasRenderingContext2D) {
    context.save()
    if (mirrored) {
      // Preview kamera depan dicerminkan; hasil foto ikut dicerminkan supaya
      // yang tersimpan sama dengan yang tadi dilihat di layar.
      context.translate(width, 0)
      context.scale(-1, 1)
    }
    context.drawImage(video, sx, sy, sw, sh, 0, 0, width, height)
    context.restore()
  }

  const originalCanvas = document.createElement('canvas')
  originalCanvas.width = width
  originalCanvas.height = height
  drawFrame(originalCanvas.getContext('2d')!)

  const filteredCanvas = document.createElement('canvas')
  filteredCanvas.width = width
  filteredCanvas.height = height
  const filteredContext = filteredCanvas.getContext('2d')!

  // Safari <17 belum mendukung ctx.filter. Kalau tidak ada, warnanya dilewat
  // tapi grain & vignette tetap jalan supaya foto masih punya karakter.
  // TODO: fallback color matrix per-piksel kalau ternyata masih banyak dipakai.
  if (typeof filteredContext.filter === 'string') {
    filteredContext.filter = style.cssFilter
  }
  drawFrame(filteredContext)
  filteredContext.filter = 'none'

  drawGrain(filteredContext, width, height, style.grainOpacity)
  drawVignette(filteredContext, width, height, style.vignetteStrength)

  const [original, filtered, thumbnail] = await Promise.all([
    toBlob(originalCanvas),
    toBlob(filteredCanvas),
    toBlob(makeThumbnail(filteredCanvas), THUMB_QUALITY),
  ])

  return {
    original,
    filtered,
    thumbnail,
    // Object URL, bukan toDataURL: base64 membengkakkan gambar ~33% dan harus
    // dirakit jadi string raksasa di memori sebelum bisa dipakai.
    previewUrl: URL.createObjectURL(thumbnail),
  }
}
