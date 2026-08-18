import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'

export default async function EventNotFound() {
  const t = await getT()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{t.notFound.title}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t.notFound.body}</p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/">{t.notFound.home}</Link>
      </Button>
    </main>
  )
}
