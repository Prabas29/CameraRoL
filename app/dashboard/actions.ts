'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { isFilmStyle } from '@/lib/film-styles'
import { createClient } from '@/lib/supabase/server'
import type { RevealMode } from '@/types/database'

export interface ActionResult {
  error: string | null
}

/**
 * Membuat event baru milik host yang sedang login.
 * Kepemilikan ditegakkan RLS (`auth.uid() = host_user_id`), jadi tidak mungkin
 * membuat event atas nama orang lain sekalipun payload-nya dioprek.
 */
export async function createEvent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'sessionExpired' }

  const name = String(formData.get('name') ?? '').trim()
  const filmStyle = String(formData.get('film_style') ?? '')
  const revealMode = String(formData.get('reveal_mode') ?? '') as RevealMode
  const revealAtRaw = String(formData.get('reveal_at') ?? '').trim()

  if (name.length < 1 || name.length > 80) {
    return { error: 'nameRequired' }
  }
  if (!isFilmStyle(filmStyle)) {
    return { error: 'unknownStyle' }
  }
  if (revealMode !== 'scheduled' && revealMode !== 'manual') {
    return { error: 'unknownMode' }
  }

  let revealAt: string | null = null
  if (revealMode === 'scheduled') {
    if (!revealAtRaw) return { error: 'pickReveal' }
    const parsed = new Date(revealAtRaw)
    if (Number.isNaN(parsed.getTime())) return { error: 'invalidReveal' }
    if (parsed.getTime() <= Date.now()) {
      return { error: 'mustBeFuture' }
    }
    revealAt = parsed.toISOString()
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      host_user_id: user.id,
      name,
      film_style: filmStyle,
      reveal_mode: revealMode,
      reveal_at: revealAt,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'createFailed' }
  }

  revalidatePath('/dashboard')
  redirect(`/dashboard/${data.id}?created=1`)
}

/** Membuka event lebih awal / untuk mode manual. Tidak bisa dibatalkan. */
export async function revealEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .update({ is_revealed: true })
    .eq('id', eventId)

  if (error) return { error: 'createFailed' }

  revalidatePath(`/dashboard/${eventId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

/** Mengganti film style event. Hanya memengaruhi foto yang diambil setelahnya. */
export async function updateFilmStyle(eventId: string, filmStyle: string): Promise<ActionResult> {
  if (!isFilmStyle(filmStyle)) return { error: 'unknownStyle' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ film_style: filmStyle })
    .eq('id', eventId)

  if (error) return { error: 'createFailed' }

  revalidatePath(`/dashboard/${eventId}`)
  return { error: null }
}

/**
 * Soft delete foto (moderasi host). File di storage sengaja dibiarkan supaya
 * salah hapus masih bisa dipulihkan lewat SQL.
 */
export async function deletePhoto(eventId: string, photoId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('photos')
    .update({ is_deleted: true })
    .eq('id', photoId)
    .eq('event_id', eventId)

  if (error) return { error: 'createFailed' }

  revalidatePath(`/dashboard/${eventId}`)
  return { error: null }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
