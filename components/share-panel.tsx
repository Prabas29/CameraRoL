'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * QR + link undangan. Dua-duanya menunjuk ke halaman join yang sama —
 * QR untuk dicetak/ditempel di meja, link untuk disebar di grup chat.
 */
export function SharePanel({ joinUrl, eventName }: { joinUrl: string; eventName: string }) {
  const t = useT()
  const qrWrapperRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      toast.success(t.eventDetail.copiedToast)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t.eventDetail.copyFailed)
    }
  }

  function downloadQr() {
    const canvas = qrWrapperRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `camerarol-qr-${slugify(eventName)}.png`
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
        text: t.eventDetail.shareText(eventName),
        url: joinUrl,
      })
    } catch {
      // Dibatalkan user — bukan error yang perlu ditampilkan.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.eventDetail.shareTitle}</CardTitle>
        <CardDescription>
          {t.eventDetail.shareDesc}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
        {/* Ring tipis + shadow: kotak putih di atas #FAFAF9 hampir tidak
            terlihat batasnya, padahal QR butuh "quiet zone" yang jelas supaya
            mudah dipindai. */}
        <div
          ref={qrWrapperRef}
          className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-border sm:mx-0"
        >
          <QRCodeCanvas value={joinUrl} size={168} level="M" marginSize={0} />
        </div>

        <div className="grid gap-3">
          <div className="overflow-x-auto rounded-md border bg-muted/40 px-3 py-2">
            <code className="whitespace-nowrap font-mono text-xs">{joinUrl}</code>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={copyLink}>
              {copied ? t.eventDetail.copied : t.eventDetail.copyLink}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={downloadQr}>
              {t.eventDetail.downloadQr}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={shareLink}>
              {t.eventDetail.share}
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
