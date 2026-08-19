'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { setGuestUpload, updateUploadPolicy } from '@/app/dashboard/actions'
import { useI18n } from '@/components/i18n-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRevealTime } from '@/lib/reveal'
import { cn } from '@/lib/utils'
import type { GuestSummary, UploadPolicy } from '@/types/database'

export function GuestAccessManager({
  eventId,
  guests,
  policy,
}: {
  eventId: string
  guests: GuestSummary[]
  policy: UploadPolicy
}) {
  const { locale, t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [currentPolicy, setCurrentPolicy] = useState<UploadPolicy>(policy)

  function reportError(key: string) {
    toast.error(
      key === 'migrationNeeded'
        ? t.access.migrationNeeded
        : (t.newEvent.errors[key as keyof typeof t.newEvent.errors] ??
          t.newEvent.errors.createFailed),
    )
  }

  function choosePolicy(next: UploadPolicy) {
    if (next === currentPolicy || pending) return

    const previous = currentPolicy
    setCurrentPolicy(next)

    startTransition(async () => {
      const result = await updateUploadPolicy(eventId, next)
      if (result.error) {
        setCurrentPolicy(previous)
        reportError(result.error)
        return
      }
      toast.success(t.access.policyUpdated)
      router.refresh()
    })
  }

  function toggleGuest(guest: GuestSummary) {
    startTransition(async () => {
      const result = await setGuestUpload(eventId, guest.id, !guest.canUpload)
      if (result.error) {
        reportError(result.error)
        return
      }
      toast.success(t.access.guestUpdated)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.access.title}</CardTitle>
        <CardDescription className="leading-relaxed">{t.access.desc}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-medium">{t.access.policyTitle}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PolicyOption
              selected={currentPolicy === 'open'}
              onSelect={() => choosePolicy('open')}
              disabled={pending}
              title={t.access.policyOpen}
              detail={t.access.policyOpenDetail}
            />
            <PolicyOption
              selected={currentPolicy === 'approval'}
              onSelect={() => choosePolicy('approval')}
              disabled={pending}
              title={t.access.policyApproval}
              detail={t.access.policyApprovalDetail}
            />
          </div>
        </div>

        {guests.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t.access.noGuests}
          </p>
        ) : (
          <ul className="grid gap-2">
            {guests.map((guest) => (
              <li
                key={guest.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-xs"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{guest.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.guests.photoCount(guest.photoCount)} ·{' '}
                    {t.guests.joinedAt(formatRevealTime(guest.joinedAt, locale))}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={guest.canUpload ? 'default' : 'secondary'}>
                    {guest.canUpload ? t.access.allowed : t.access.blocked}
                  </Badge>
                  <Button
                    size="sm"
                    variant={guest.canUpload ? 'ghost' : 'default'}
                    disabled={pending}
                    onClick={() => toggleGuest(guest)}
                  >
                    {guest.canUpload ? (
                      <>
                        <XIcon />
                        {t.access.revoke}
                      </>
                    ) : (
                      <>
                        <CheckIcon />
                        {t.access.allow}
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function PolicyOption({
  selected,
  onSelect,
  disabled,
  title,
  detail,
}: {
  selected: boolean
  onSelect: () => void
  disabled: boolean
  title: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'rounded-2xl border bg-card p-5 text-left shadow-xs transition-all disabled:opacity-60',
        selected
          ? 'border-primary bg-primary/8 shadow-sm ring-2 ring-primary/25'
          : 'hover:border-muted-foreground/30 hover:shadow-sm',
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
    </button>
  )
}
