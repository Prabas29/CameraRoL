'use client'

import { applyColorMatrix, buildColorMatrix } from '@/lib/color-matrix'
import type { FilmStyleDef } from '@/lib/film-styles'

/**
 * Sisi terpanjang foto hasil.
 *
 * Naik dari 1600 ke 3000. Angka lama membuat foto dari HP modern justru
 * diperkecil: kamera belakang umumnya menyerahkan frame 2160 px atau lebih,
 * lalu dipotong jadi 1600 dan terlihat lunak begitu dibuka besar atau di-zoom.
 * 3000 px cukup untuk cetak 10R dan tetap wajar untuk diunggah lewat data
 * seluler.
 *
 * Ini batas atas, bukan target: `Math.min(1, MAX_EDGE / sisiTerpanjang)`
 * berarti frame yang lebih kecil tidak pernah diperbesar, karena memperbesar
 * hanya menambah ukuran file tanpa menambah detail.
 */
const MAX_EDGE = 3000

/** 0.92, bukan 0.9: grain film menambah derau frekuensi tinggi yang paling
 *  dulu rusak saat kompresi JPEG, dan itu terlihat sebagai bercak di area rata
 *  seperti langit atau dinding. */
const JPEG_QUALITY = 0.92

/**
 * Thumbnail untuk grid gallery. Petak di grid tidak pernah lebih lebar dari
 * ~300 px, tapi layar retina memampatkan 2 sampai 3 piksel fisik ke tiap
 * piksel CSS, jadi 640 px yang membuatnya tetap tajam. Kualitas boleh lebih
 * rendah karena file ini tidak pernah dilihat besar-besar, lightbox dan
 * unduhan tetap memakai versi penuh.
 */
const THUMB_EDGE = 640
const THUMB_QUALITY = 0.75

const GRAIN_TILE = 128

export interface CapturedPhoto {
  /** Frame mentah tanpa filter, arsip untuk render ulang di kemudian hari. */
  original: Blob
  /** Frame yang filternya sudah di-bake, dipakai lightbox & unduhan. */
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

/**
 * Anggaran ukuran satu unggahan.
 *
 * Serverless function di Vercel menolak body request di atas 4.5 MB, dan ketiga
 * file dikirim bersamaan dalam satu multipart. Menaikkan MAX_EDGE tanpa penjaga
 * ini berarti foto berdetail tinggi, justru foto yang paling ingin tajam, akan
 * gagal diunggah dengan 413 yang membingungkan tamu.
 *
 * Diberi margin ke 3.9 MB karena batas itu berlaku untuk seluruh body termasuk
 * boundary multipart dan header tiap bagian, bukan hanya isi filenya.
 */
const UPLOAD_BUDGET_BYTES = 3_900_000

/** Turunan kualitas yang dicoba berurutan kalau hasil pertama kebesaran. */
const QUALITY_STEPS = [JPEG_QUALITY, 0.86, 0.8, 0.72]

/**
 * Mengencode versi mentah dan versi filtered serapat mungkin ke batas anggaran.
 *
 * Yang diturunkan kualitas kompresinya, bukan resolusinya. Untuk foto yang
 * nanti dilihat besar atau di-zoom, piksel yang lebih banyak dengan kompresi
 * sedikit lebih dalam hampir selalu terlihat lebih baik daripada gambar kecil
 * berkompresi ringan.
 */
async function encodeWithinBudget(
  originalCanvas: HTMLCanvasElement,
  filteredCanvas: HTMLCanvasElement,
  thumbnailBytes: number,
): Promise<{ original: Blob; filtered: Blob }> {
  let original = await toBlob(originalCanvas, QUALITY_STEPS[0])
  let filtered = await toBlob(filteredCanvas, QUALITY_STEPS[0])

  for (let step = 1; step < QUALITY_STEPS.length; step += 1) {
    if (original.size + filtered.size + thumbnailBytes <= UPLOAD_BUDGET_BYTES) break

    const quality = QUALITY_STEPS[step]
    original = await toBlob(originalCanvas, quality)
    filtered = await toBlob(filteredCanvas, quality)
  }

  return { original, filtered }
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
 * Warna dihitung dari `style.ops`, sumber yang sama dengan yang menurunkan
 * `cssFilter` untuk live preview, jadi hasil foto tidak bisa melenceng dari
 * yang dilihat tamu di layar.
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

  drawFrame(filteredContext)

  // Warna dihitung sendiri, TIDAK lewat ctx.filter.
  //
  // ctx.filter tidak bisa dipercaya: di Safari iOS properti itu ada dan bisa
  // di-assign tanpa error, tapi tidak berefek pada drawImage dari <video>.
  // Hasilnya foto tersimpan tanpa filter sama sekali padahal live preview
  // terlihat benar, dan tidak ada error yang memberi tahu. Matriks warna
  // memberi hasil yang sama di semua browser.
  const matrix = buildColorMatrix(style.ops)
  const frame = filteredContext.getImageData(0, 0, width, height)
  applyColorMatrix(frame.data, matrix)
  filteredContext.putImageData(frame, 0, 0)

  drawGrain(filteredContext, width, height, style.grainOpacity)
  drawVignette(filteredContext, width, height, style.vignetteStrength)

  const thumbnail = await toBlob(makeThumbnail(filteredCanvas), THUMB_QUALITY)
  const { original, filtered } = await encodeWithinBudget(
    originalCanvas,
    filteredCanvas,
    thumbnail.size,
  )

  return {
    original,
    filtered,
    thumbnail,
    // Object URL, bukan toDataURL: base64 membengkakkan gambar ~33% dan harus
    // dirakit jadi string raksasa di memori sebelum bisa dipakai.
    previewUrl: URL.createObjectURL(thumbnail),
  }
}
