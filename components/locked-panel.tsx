'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

import { Countdown } from '@/components/countdown'

/**
 * Tampilan tunggu sebelum reveal.
 *
 * Saat hitungan habis, halaman minta data ulang ke server — bukan membuka
 * sendiri. Server yang memutuskan album sudah boleh dibuka atau belum, jadi
 * memajukan jam perangkat tidak menghasilkan apa-apa selain angka yang salah.
 */
export function LockedPanel({ revealAtIso }: { revealAtIso: string | null }) {
  const router = useRouter()

  const recheck = useCallback(() => router.refresh(), [router])

  // Mode manual tidak punya target waktu, jadi tanya server berkala kalau-kalau
  // host sudah menekan tombol buka.
  useEffect(() => {
    if (revealAtIso) return
    const timer = window.setInterval(recheck, 15_000)
    return () => window.clearInterval(timer)
  }, [revealAtIso, recheck])

  if (!revealAtIso) {
    return (
      <p className="text-sm text-muted-foreground">
        Menunggu host membuka album. Halaman ini akan terbuka sendiri begitu itu terjadi.
      </p>
    )
  }

  return <Countdown targetIso={revealAtIso} onComplete={recheck} />
}
