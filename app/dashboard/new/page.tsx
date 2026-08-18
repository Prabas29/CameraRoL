import Link from 'next/link'

import { CreateEventForm } from '@/components/create-event-form'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t.meta.newEvent }
}

export default async function NewEventPage() {
  const t = await getT()

  return (
    <div className="grid gap-10">
      <div className="grid gap-1">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t.common.back}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t.newEvent.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.newEvent.subtitle}</p>
      </div>

      <CreateEventForm />
    </div>
  )
}
