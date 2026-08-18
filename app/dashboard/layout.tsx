import Link from 'next/link'

import { signOut } from '@/app/dashboard/actions'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [t, { data: { user } }] = await Promise.all([getT(), supabase.auth.getUser()])

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            {t.common.appName}
            <span className="text-primary">.</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <LanguageSwitcher />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                {t.dashboard.signOut}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">{children}</main>
    </div>
  )
}
