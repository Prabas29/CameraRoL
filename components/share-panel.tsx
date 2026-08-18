'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * QR + link undangan. Dua-duanya menunjuk ke halaman join yang sama —
 * QR untuk dicetak/ditempel di meja, link untuk disebar di grup chat.
 */
export function SharePanel({ joinUrl, eventName }: { joinUrl: string; eventName: string }) {
  const qrWrapperRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      toast.success('Link disalin')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin. Salin manual dari kotak di atas, ya.')
    }
  }

  function downloadQr() {
    const canvas = qrWrapperRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `rol-qr-${slugify(eventName)}.png`
    link.click()
  }

  async function shareLink() {
    if (!navigator.share) {
      void copyLink()
      return
    }
    try {
      await navigator.share({
        title: eventName,
        text: `Ikut foto di ${eventName} pakai Rol`,
        url: joinUrl,
      })
    } catch {
      // Dibatalkan user — bukan error yang perlu ditampilkan.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bagikan ke tamu</CardTitle>
        <CardDescription>
          Cetak QR-nya, atau sebar linknya. Tamu tidak perlu instal aplikasi atau login.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
        <div ref={qrWrapperRef} className="mx-auto w-fit rounded-lg bg-white p-3 sm:mx-0">
          <QRCodeCanvas value={joinUrl} size={168} level="M" marginSize={0} />
        </div>

        <div className="grid gap-3">
          <div className="overflow-x-auto rounded-md border bg-muted/40 px-3 py-2">
            <code className="whitespace-nowrap font-mono text-xs">{joinUrl}</code>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={copyLink}>
              {copied ? 'Tersalin' : 'Salin link'}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={downloadQr}>
              Unduh QR
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={shareLink}>
              Bagikan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'acara'
  )
}
