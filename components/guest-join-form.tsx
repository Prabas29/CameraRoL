'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDeviceId, getStoredGuestName, storeGuestName } from '@/lib/device'

export function GuestJoinForm({ eventId }: { eventId: string }) {
  const t = useT()
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
        setError(payload.error ?? t.join.joinFailed)
        setSubmitting(false)
        return
      }

      storeGuestName(eventId, name.trim())
      router.replace(`/e/${eventId}/camera`)
    } catch {
      setError(t.join.connectError)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="guest-name">{t.join.nameLabel}</Label>
        <Input
          id="guest-name"
          required
          maxLength={40}
          autoComplete="name"
          placeholder={t.join.namePlaceholder}
          value={name}
          onChange={(changeEvent) => setName(changeEvent.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t.join.nameNote}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={submitting || name.trim().length === 0}>
        {submitting ? t.join.starting : t.join.start}
      </Button>
    </form>
  )
}
