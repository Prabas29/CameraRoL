import type { FilterOp } from '@/lib/film-styles'

/**
 * Matriks warna afin untuk RGB.
 *
 * Dua belas angka: sembilan koefisien pencampur kanal, tiga offset. Alpha tidak
 * disentuh sama sekali, jadi tidak perlu baris keempat.
 *
 *   R' = m[0]*R + m[1]*G + m[2]*B + m[3]
 *   G' = m[4]*R + m[5]*G + m[6]*B + m[7]
 *   B' = m[8]*R + m[9]*G + m[10]*B + m[11]
 */
export type ColorMatrix = readonly number[]

const IDENTITY: ColorMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]

/**
 * Menggabungkan dua matriks: `next` diterapkan SETELAH `prev`.
 *
 * Urutan penting. `sepia(0.3) saturate(1.4)` tidak sama dengan kebalikannya,
 * dan CSS menerapkannya kiri ke kanan.
 */
function compose(prev: ColorMatrix, next: ColorMatrix): ColorMatrix {
  const out = new Array<number>(12)

  for (let row = 0; row < 3; row += 1) {
    const n0 = next[row * 4]
    const n1 = next[row * 4 + 1]
    const n2 = next[row * 4 + 2]

    for (let col = 0; col < 3; col += 1) {
      out[row * 4 + col] = n0 * prev[col] + n1 * prev[4 + col] + n2 * prev[8 + col]
    }

    // Offset ikut melewati matriks berikutnya, lalu ditambah offset sendiri.
    out[row * 4 + 3] = n0 * prev[3] + n1 * prev[7] + n2 * prev[11] + next[row * 4 + 3]
  }

  return out
}

/**
 * Matriks untuk satu fungsi filter, mengikuti definisi di spesifikasi Filter
 * Effects. Angka luminansi 0.213 / 0.715 / 0.072 diambil dari sana, bukan
 * dikarang, supaya hasilnya sama persis dengan yang dirender browser untuk
 * `filter` CSS di live preview.
 */
function matrixFor({ fn, value }: FilterOp): ColorMatrix {
  switch (fn) {
    case 'brightness':
      return [value, 0, 0, 0, 0, value, 0, 0, 0, 0, value, 0]

    case 'contrast': {
      // Titik putarnya 0.5 pada skala 0..1, jadi 127.5 pada skala 0..255.
      const offset = 127.5 * (1 - value)
      return [value, 0, 0, offset, 0, value, 0, offset, 0, 0, value, offset]
    }

    case 'saturate':
    case 'grayscale': {
      // grayscale(a) menurut spesifikasi setara dengan saturate(1 - a).
      const s = fn === 'grayscale' ? 1 - value : value
      return [
        0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0,
        0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0,
        0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0,
      ]
    }

    case 'sepia': {
      // Interpolasi antara identitas dan matriks sepia sebesar `value`.
      const t = value
      return [
        1 - 0.607 * t, 0.769 * t, 0.189 * t, 0,
        0.349 * t, 1 - 0.314 * t, 0.168 * t, 0,
        0.272 * t, 0.534 * t, 1 - 0.869 * t, 0,
      ]
    }
  }
}

/** Menggabungkan seluruh rantai filter jadi satu matriks. */
export function buildColorMatrix(ops: FilterOp[]): ColorMatrix {
  return ops.reduce<ColorMatrix>((acc, op) => compose(acc, matrixFor(op)), IDENTITY)
}

/** True kalau matriksnya tidak mengubah apa pun, sehingga looping bisa dilewati. */
export function isIdentity(matrix: ColorMatrix): boolean {
  return matrix.every((value, index) => Math.abs(value - IDENTITY[index]) < 1e-6)
}

/**
 * Menerapkan matriks ke seluruh piksel, di tempat.
 *
 * Dijalankan sendiri alih-alih menyerahkannya ke `ctx.filter` karena properti
 * itu tidak bisa dipercaya: di sebagian browser ia ada tapi tidak berefek pada
 * drawImage dari <video>, dan kegagalannya senyap. Satu jalur perhitungan
 * berarti hasilnya sama di mana pun.
 */
export function applyColorMatrix(data: Uint8ClampedArray, matrix: ColorMatrix): void {
  if (isIdentity(matrix)) return

  const [rr, rg, rb, ro, gr, gg, gb, go, br, bg, bb, bo] = matrix

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Uint8ClampedArray sudah memotong ke 0..255 dan membulatkan sendiri,
    // jadi tidak perlu Math.min/max manual.
    data[i] = rr * r + rg * g + rb * b + ro
    data[i + 1] = gr * r + gg * g + gb * b + go
    data[i + 2] = br * r + bg * g + bb * b + bo
  }
}
