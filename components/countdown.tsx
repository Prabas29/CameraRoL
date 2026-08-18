'use client'

import { useEffect, useState } from 'react'

import { splitDuration } from '@/lib/reveal'

/**
 * Hitung mundur menuju waktu reveal.
 *
 * Ini murni lapisan tampilan. Gerbang sebenarnya ada di server — mengubah jam
 * perangkat cuma membuat angka di sini salah, tidak membuka foto.
 */
export function Countdown({
  targetIso,
  onComplete,
  className,
}: {
  targetIso: string
  onComplete?: () => void
  className?: string
}) {
  const target = new Date(targetIso).getTime()
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()))

  useEffect(() => {
    // Render pertama di server tidak tahu jam client; sinkronkan setelah mount
    // agar tidak ada hydration mismatch.
    setRemaining(Math.max(0, target - Date.now()))

    const timer = window.setInterval(() => {
      const next = Math.max(0, target - Date.now())
      setRemaining(next)
      if (next === 0) {
        window.clearInterval(timer)
        onComplete?.()
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [target, onComplete])

  const { days, hours, minutes, seconds } = splitDuration(remaining)
  const units = days > 0
    ? [
        { value: days, label: 'hari' },
        { value: hours, label: 'jam' },
        { value: minutes, label: 'menit' },
      ]
    : [
        { value: hours, label: 'jam' },
        { value: minutes, label: 'menit' },
        { value: seconds, label: 'detik' },
      ]

  return (
    <div className={className}>
      <div className="flex items-end gap-3 tabular-nums">
        {units.map((unit) => (
          <div key={unit.label} className="grid gap-1 text-center">
            <span className="font-mono text-4xl font-semibold leading-none">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
