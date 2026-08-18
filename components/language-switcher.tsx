'use client'

import { GlobeIcon } from 'lucide-react'
import { useTransition } from 'react'

import { setLocale } from '@/app/actions/locale'
import { useI18n } from '@/components/i18n-provider'
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

/**
 * Pemilih bahasa berbentuk segmented control ala iOS.
 *
 * Hanya dua bahasa, jadi menampilkan keduanya sekaligus lebih cepat dipakai
 * daripada dropdown — satu ketukan, bukan dua.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()

  function choose(next: string) {
    if (next === locale || pending) return

    const formData = new FormData()
    formData.set('locale', next)
    startTransition(() => setLocale(formData))
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-secondary p-1',
        pending && 'opacity-60',
        className,
      )}
      role="group"
      aria-label={t.common.language}
    >
      <GlobeIcon className="ml-1.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />

      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          disabled={pending}
          aria-pressed={code === locale}
          aria-label={LOCALE_NAMES[code]}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium uppercase transition-colors',
            code === locale
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
