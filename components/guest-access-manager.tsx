'use client'

import { CheckIcon, UserMinusIcon, UserPlusIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/components/i18n-provider'
import {
  removeGuest,
  restoreGuest,
  setGuestUpload,
  updateUploadPolicy,
} from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [removeTarget, setRemoveTarget] = useState<GuestSummary | null>(null)

  const active = guests.filter((guest) => !guest.removed)
  const removed = guests.filter((guest) => guest.removed)

  function reportError(key: string) {
    toast.error(
      key === 'migrationNeeded'
        ? t.access.migrationNeeded
        : (t.newEvent.errors[key as keyof typeof t.newEvent.errors] ??
          t.newEvent.errors.createFailed),
    )
  }

  function run(action: () => Promise<{ error: string | null }>, successMessage: string) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        reportError(result.error)
        return
      }
      toast.success(successMessage)
      router.refresh()
    })
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

  function confirmRemove() {
    if (!removeTarget) return
    const guestId = removeTarget.id

    startTransition(async () => {
      const result = await removeGuest(eventId, guestId)
      setRemoveTarget(null)
      if (result.error) {
        reportError(result.error)
        return
      }
      toast.success(t.access.removedToast)
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

        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t.access.noGuests}
          </p>
        ) : (
          <ul className="grid gap-2">
            {active.map((guest) => (
              <li
                key={guest.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-xs"
              >
                <GuestIdentity guest={guest} locale={locale} label={t.guests.photoCount(guest.photoCount)} joinedLabel={t.guests.joinedAt} />

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={guest.canUpload ? 'default' : 'secondary'}>
                    {guest.canUpload ? t.access.allowed : t.access.blocked}
                  </Badge>
                  <Button
                    size="sm"
                    variant={guest.canUpload ? 'ghost' : 'default'}
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => setGuestUpload(eventId, guest.id, !guest.canUpload),
                        t.access.guestUpdated,
                      )
                    }
                  >
                    {guest.canUpload ? <XIcon /> : <CheckIcon />}
                    {guest.canUpload ? t.access.revoke : t.access.allow}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => setRemoveTarget(guest)}
                  >
                    <UserMinusIcon />
                    {t.access.remove}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {removed.length > 0 ? (
          <div className="grid gap-3">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t.access.removedSection}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.access.removedSectionDesc}
              </p>
            </div>

            <ul className="grid gap-2">
              {removed.map((guest) => (
                <li
                  key={guest.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed bg-muted/40 p-4"
                >
                  <GuestIdentity
                    guest={guest}
                    locale={locale}
                    label={t.guests.photoCount(guest.photoCount)}
                    joinedLabel={t.guests.joinedAt}
                    muted
                  />

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      run(() => restoreGuest(eventId, guest.id), t.access.restoredToast)
                    }
                  >
                    <UserPlusIcon />
                    {t.access.restore}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.access.removeTitle(removeTarget?.name ?? '')}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {t.access.removeDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoveTarget(null)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmRemove} disabled={pending}>
              {pending ? t.access.removing : t.access.removeConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function GuestIdentity({
  guest,
  locale,
  label,
  joinedLabel,
  muted = false,
}: {
  guest: GuestSummary
  locale: string
  label: string
  joinedLabel: (time: string) => string
  muted?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className={cn('truncate text-sm font-medium', muted && 'text-muted-foreground')}>
        {guest.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {label} · {joinedLabel(formatRevealTime(guest.joinedAt, locale))}
      </p>
    </div>
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
