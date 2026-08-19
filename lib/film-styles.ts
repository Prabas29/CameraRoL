import type { FilmStyle } from '@/types/database'

export type { FilmStyle }

/** Fungsi filter yang dipakai project ini. Semuanya bisa ditulis jadi matriks warna. */
export type FilterFn = 'grayscale' | 'sepia' | 'saturate' | 'contrast' | 'brightness'

export interface FilterOp {
  fn: FilterFn
  value: number
}

export interface FilmStyleDef {
  id: FilmStyle
  /**
   * Sumber kebenaran look-nya, dalam bentuk data.
   *
   * Dulu yang jadi sumber adalah string CSS, dan proses bake mengandalkan
   * `ctx.filter` untuk menerapkannya. Ternyata di sebagian browser, terutama
   * Safari iOS, `ctx.filter` ADA sebagai properti tapi tidak berefek pada
   * drawImage dari <video>. Akibatnya foto tersimpan tanpa filter sama sekali
   * sementara preview-nya terlihat benar, dan kegagalannya senyap.
   *
   * Sekarang bake menghitung warnanya sendiri dari `ops`, sehingga hasilnya
   * sama di semua browser. String CSS di bawah diturunkan dari `ops` yang sama,
   * jadi preview dan hasil tetap tidak bisa melenceng.
   */
  ops: FilterOp[]
  /** Diturunkan dari `ops`. Dipakai CSS `filter` pada live preview. */
  cssFilter: string
  /** Opacity overlay grain, 0–1. 0 = tanpa grain. */
  grainOpacity: number
  /** Kepekatan vignette di sudut frame, 0–1. 0 = tanpa vignette. */
  vignetteStrength: number
}

function toCssFilter(ops: FilterOp[]): string {
  return ops.map((op) => `${op.fn}(${op.value})`).join(' ')
}

function defineStyle(
  id: FilmStyle,
  ops: FilterOp[],
  grainOpacity: number,
  vignetteStrength: number,
): FilmStyleDef {
  return { id, ops, cssFilter: toCssFilter(ops), grainOpacity, vignetteStrength }
}

/**
 * Hanya bagian teknisnya yang tinggal di sini. Label dan deskripsi pindah ke
 * kamus bahasa (`t.filmStyles`), karena keduanya teks tampilan, sementara
 * `cssFilter` dan angka grain/vignette sama di bahasa mana pun.
 */
export const FILM_STYLES: Record<FilmStyle, FilmStyleDef> = {
  vintage: defineStyle(
    'vintage',
    [
      { fn: 'sepia', value: 0.3 },
      { fn: 'saturate', value: 1.4 },
      { fn: 'contrast', value: 1.1 },
      { fn: 'brightness', value: 1.05 },
    ],
    0.1,
    0.35,
  ),
  original: defineStyle(
    'original',
    [
      { fn: 'contrast', value: 1.05 },
      { fn: 'saturate', value: 1.05 },
    ],
    0.03,
    0.12,
  ),
  bw: defineStyle(
    'bw',
    [
      { fn: 'grayscale', value: 1 },
      { fn: 'contrast', value: 1.2 },
    ],
    0.13,
    0.3,
  ),
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
