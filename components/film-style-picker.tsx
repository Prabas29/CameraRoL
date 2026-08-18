'use client'

import { FILM_STYLE_LIST, grainDataUri } from '@/lib/film-styles'
import { cn } from '@/lib/utils'
import type { FilmStyle } from '@/types/database'

/**
 * Pemilih film style dengan swatch yang benar-benar memakai `cssFilter` dari
 * lib/film-styles — jadi apa yang dilihat host di sini adalah look yang sama
 * dengan yang nanti muncul di kamera dan di foto hasilnya.
 */
export function FilmStylePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: FilmStyle
  onChange: (next: FilmStyle) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {FILM_STYLE_LIST.map((style) => {
        const selected = style.id === value

        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(style.id)}
            aria-pressed={selected}
            className={cn(
              'overflow-hidden rounded-lg border text-left transition-colors disabled:opacity-50',
              selected ? 'border-primary' : 'hover:border-muted-foreground/40',
            )}
          >
            <div className="relative aspect-[4/3] w-full">
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

            <div className={cn('p-3', selected && 'bg-primary/10')}>
              <span className="block text-sm font-medium">{style.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {style.description}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
