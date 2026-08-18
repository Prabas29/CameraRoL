'use client'

import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
  placeholder = 'Pilih tanggal & waktu',
}: {
  value: Date | undefined
  onChange: (next: Date | undefined) => void
  disabled?: boolean
  id?: string
  placeholder?: string
}) {
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
              {format(value, 'd MMMM yyyy', { locale: localeId })}, {pad(hours)}:{pad(minutes)}
            </span>
          ) : (
            <span>{placeholder}</span>
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
          locale={localeId}
          autoFocus
        />

        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" />
            <span>Jam reveal</span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(hours)}
              onValueChange={(next) => handleTimeChange(Number(next), minutes)}
            >
              <SelectTrigger className="flex-1 tabular-nums" aria-label="Jam">
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
              <SelectTrigger className="flex-1 tabular-nums" aria-label="Menit">
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
            Selesai
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
