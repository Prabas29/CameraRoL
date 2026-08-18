import Link from 'next/link'

import { CreateEventForm } from '@/components/create-event-form'

export const metadata = { title: 'Buat acara — Rol' }

export default function NewEventPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Buat acara</h1>
        <p className="text-sm text-muted-foreground">
          Tamu tidak perlu instal apa pun. Mereka cukup scan QR, isi nama, lalu memotret.
        </p>
      </div>

      <CreateEventForm />
    </div>
  )
}
