'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDeviceId, getStoredGuestName, storeGuestName } from '@/lib/device'

export function GuestJoinForm({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kalau perangkat ini pernah join, tawarkan nama yang sama supaya tamu tidak
  // perlu mengetik ulang.
  useEffect(() => {
    const stored = getStoredGuestName(eventId)
    if (stored) setName(stored)
  }, [eventId])

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId(), name: name.trim() }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(payload.error ?? 'Gagal bergabung. Coba lagi.')
        setSubmitting(false)
        return
      }

      storeGuestName(eventId, name.trim())
      router.replace(`/e/${eventId}/camera`)
    } catch {
      setError('Tidak bisa terhubung. Cek koneksimu, lalu coba lagi.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="guest-name">Namamu</Label>
        <Input
          id="guest-name"
          required
          maxLength={40}
          autoComplete="name"
          placeholder="Dina"
          value={name}
          onChange={(changeEvent) => setName(changeEvent.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Nama ini muncul di bawah foto-fotomu saat album dibuka.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={submitting || name.trim().length === 0}>
        {submitting ? 'Menyiapkan kamera…' : 'Mulai memotret'}
      </Button>
    </form>
  )
}
