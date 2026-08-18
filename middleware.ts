import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  /*
   * Hanya rute yang memang punya sesi host.
   *
   * Sebelumnya matcher-nya mencakup hampir semua path, sehingga SETIAP request
   * tamu, halaman join, kamera, upload foto, ikut memanggil
   * supabase.auth.getUser(). Itu satu round-trip jaringan ke Supabase demi
   * memastikan sesuatu yang sudah pasti: tamu tidak pernah punya sesi Supabase.
   *
   * Membatasi ke /dashboard dan /login menghapus round-trip itu dari seluruh
   * jalur tamu, tanpa mengurangi penjagaan apa pun, /dashboard tetap dijaga,
   * dan token host tetap disegarkan setiap kali ia membuka dashboard.
   */
  matcher: ['/dashboard/:path*', '/login'],
}
