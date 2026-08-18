import type { FilmStyle } from '@/types/database'

export type { FilmStyle }

export interface FilmStyleDef {
  id: FilmStyle
  /**
   * String filter yang dipakai apa adanya di DUA tempat:
   *   1. CSS `filter` pada <video> untuk live preview
   *   2. Canvas `ctx.filter` saat mem-"bake" foto sebelum upload
   * Karena sintaksnya identik, preview dan hasil akhir tidak bisa melenceng.
   */
  cssFilter: string
  /** Opacity overlay grain, 0–1. 0 = tanpa grain. */
  grainOpacity: number
  /** Kepekatan vignette di sudut frame, 0–1. 0 = tanpa vignette. */
  vignetteStrength: number
}

/**
 * Hanya bagian teknisnya yang tinggal di sini. Label dan deskripsi pindah ke
 * kamus bahasa (`t.filmStyles`), karena keduanya teks tampilan — sementara
 * `cssFilter` dan angka grain/vignette sama di bahasa mana pun.
 */
export const FILM_STYLES: Record<FilmStyle, FilmStyleDef> = {
  vintage: {
    id: 'vintage',
    cssFilter: 'sepia(0.3) saturate(1.4) contrast(1.1) brightness(1.05)',
    grainOpacity: 0.1,
    vignetteStrength: 0.35,
  },
  original: {
    id: 'original',
    cssFilter: 'contrast(1.05) saturate(1.05)',
    grainOpacity: 0.03,
    vignetteStrength: 0.12,
  },
  bw: {
    id: 'bw',
    cssFilter: 'grayscale(1) contrast(1.2)',
    grainOpacity: 0.13,
    vignetteStrength: 0.3,
  },
}

export const FILM_STYLE_LIST: FilmStyleDef[] = [
  FILM_STYLES.vintage,
  FILM_STYLES.original,
  FILM_STYLES.bw,
]

export function getFilmStyle(id: string | null | undefined): FilmStyleDef {
  if (id && id in FILM_STYLES) return FILM_STYLES[id as FilmStyle]
  return FILM_STYLES.original
}

export function isFilmStyle(value: unknown): value is FilmStyle {
  return typeof value === 'string' && value in FILM_STYLES
}

/**
 * Overlay grain untuk live preview. Pakai feTurbulence sebagai data-URI supaya
 * tidak perlu aset PNG, dan look-nya sejalan dengan grain prosedural yang
 * dipakai saat baking di canvas.
 */
export function grainDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}
