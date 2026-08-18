import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { FILM_STYLE_LIST, grainDataUri } from '@/lib/film-styles'

const STEPS = [
  {
    title: 'Buat acara',
    detail: 'Beri nama, pilih film style, tentukan kapan foto boleh dibuka.',
  },
  {
    title: 'Bagikan satu QR',
    detail: 'Tamu scan, isi nama, langsung memotret. Tanpa instal, tanpa akun.',
  },
  {
    title: 'Buka bareng',
    detail: 'Saat waktunya tiba, semua foto muncul sekaligus jadi satu album.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">
          Rol<span className="text-primary">.</span>
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Masuk sebagai host</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="grid gap-6 py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Kamera sekali pakai, versi digital, untuk acaramu.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Tamu memotret sepuasnya lewat browser. Hasilnya terkunci sampai acara usai —
            lalu terbuka serentak jadi satu album bersama.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/login">Mulai buat acara</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {FILM_STYLE_LIST.map((style) => (
            <div key={style.id} className="overflow-hidden rounded-xl border">
              <div className="relative aspect-[4/3]">
                <div
                  className="absolute inset-0"
                  style={{
                    filter: style.cssFilter,
                    background:
                      'linear-gradient(135deg, #f5c98f 0%, #d9825a 35%, #7a4a63 68%, #23303f 100%)',
                  }}
                />
                <div
                  className="absolute inset-0 mix-blend-overlay"
                  style={{ backgroundImage: grainDataUri(), opacity: style.grainOpacity * 4 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${style.vignetteStrength}) 100%)`,
                  }}
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium">{style.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{style.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 pt-20 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="grid gap-2">
              <span className="font-mono text-sm text-primary">0{index + 1}</span>
              <h2 className="text-base font-medium">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
