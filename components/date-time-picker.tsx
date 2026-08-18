'use client'

import { format } from 'date-fns'
import { enGB, id as localeId } from 'date-fns/locale'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import { useI18n } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** Jam default saat host memilih tanggal tapi belum menyentuh jam sama sekali. */
const DEFAULT_HOUR = 19
const DEFAULT_MINUTE = 0

const HOURS = Array.from({ length: 24 }, (_, index) => index)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Kalender dimuat terpisah, bukan ikut bundel awal halaman.
 *
 * react-day-picker + date-fns berbobot ~50 kB, padahal isinya baru terlihat
 * setelah host membuka popover. PopoverContent milik Radix memang tidak
 * di-mount sampai terbuka, jadi chunk-nya baru diambil tepat saat dibutuhkan.
 */
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then((mod) => mod.Calendar),
  {
    ssr: false,
    // Placeholder tanpa teks: fallback ini dirender di luar pohon komponen,
    // jadi tidak punya akses ke kamus bahasa. Kotak berdenyut netral di semua
    // bahasa dan tidak perlu diterjemahkan.
    loading: () => <div className="m-3 h-64 w-64 animate-pulse rounded-xl bg-secondary" />,
  },
)

/** Menggabungkan tanggal dari kalender dengan jam & menit dari time picker. */
function withTime(day: Date, hours: number, minutes: number): Date {
  const combined = new Date(day)
  combined.setHours(hours, minutes, 0, 0)
  return combined
}

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Pemilih tanggal + waktu dalam satu popover.
 *
 * Nilainya selalu satu `Date` utuh — pemanggil yang mengubahnya jadi ISO string.
 * Tanggal dan jam sengaja tidak dipisah jadi dua state supaya tidak ada momen
 * di mana keduanya tidak sinkron.
 */
export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  id,
  placeholder,
}: {
  value: Date | undefined
  onChange: (next: Date | undefined) => void
  disabled?: boolean
  id?: string
  placeholder?: string
}) {
  const { locale, t } = useI18n()
  const dateLocale = locale === 'en' ? enGB : localeId
  const [open, setOpen] = useState(false)

  const hours = value ? value.getHours() : DEFAULT_HOUR
  const minutes = value ? value.getMinutes() : DEFAULT_MINUTE

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(undefined)
      return
    }
    onChange(withTime(day, hours, minutes))
  }

  function handleTimeChange(nextHours: number, nextMinutes: number) {
    // Belum ada tanggal? Pakai hari ini sebagai dasar supaya time picker tetap
    // bisa dipakai lebih dulu; validasi "harus di masa depan" yang menangani
    // kalau jamnya ternyata sudah lewat.
    onChange(withTime(value ?? new Date(), nextHours, nextMinutes))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-primary" />
          {value ? (
            <span className="tabular-nums">
              {format(value, 'd MMMM yyyy', { locale: dateLocale })}, {pad(hours)}:{pad(minutes)}
            </span>
          ) : (
            <span>{placeholder ?? t.newEvent.pickDateTime}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          defaultMonth={value ?? new Date()}
          disabled={{ before: startOfToday() }}
          locale={dateLocale}
          autoFocus
        />

        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" />
            <span>{t.newEvent.hourLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(hours)}
              onValueChange={(next) => handleTimeChange(Number(next), minutes)}
            >
              <SelectTrigger className="flex-1 tabular-nums" aria-label={t.newEvent.hourAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-56">
                {HOURS.map((hour) => (
                  <SelectItem key={hour} value={String(hour)} className="tabular-nums">
                    {pad(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground">:</span>

            <Select
              value={String(minutes)}
              onValueChange={(next) => handleTimeChange(hours, Number(next))}
            >
              <SelectTrigger className="flex-1 tabular-nums" aria-label={t.newEvent.minuteAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-56">
                {MINUTES.map((minute) => (
                  <SelectItem key={minute} value={String(minute)} className="tabular-nums">
                    {pad(minute)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            size="sm"
            className="mt-3 w-full"
            disabled={!value}
            onClick={() => setOpen(false)}
          >
            {t.newEvent.done}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
