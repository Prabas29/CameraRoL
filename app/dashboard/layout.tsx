import Link from 'next/link'

import { signOut } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Rol<span className="text-primary">.</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">{children}</main>
    </div>
  )
}
