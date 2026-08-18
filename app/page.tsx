import Link from 'next/link'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { FILM_STYLE_LIST, grainDataUri } from '@/lib/film-styles'
import { getT } from '@/lib/i18n/server'

export default async function HomePage() {
  const t = await getT()

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">
          {t.common.appName}
          <span className="text-primary">.</span>
        </span>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t.landing.signIn}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="grid gap-6 py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t.landing.title}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t.landing.subtitle}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/login">{t.landing.cta}</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FILM_STYLE_LIST.map((style) => {
            const copy = t.filmStyles[style.id]

            return (
              <div key={style.id} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
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
                <div className="p-5">
                  <p className="text-sm font-semibold">{copy.label}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {copy.description}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        <section className="grid gap-8 pt-20 sm:grid-cols-3">
          {t.landing.steps.map((step, index) => (
            <div key={step.title} className="grid gap-2">
              <span className="font-mono text-sm text-primary">0{index + 1}</span>
              <h2 className="text-base font-semibold">{step.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
