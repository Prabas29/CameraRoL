import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function EventNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Acara tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Link atau QR-nya mungkin salah ketik, atau acaranya sudah dihapus host. Coba minta
        link terbaru ke yang mengundangmu.
      </p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/">Ke halaman utama</Link>
      </Button>
    </main>
  )
}
