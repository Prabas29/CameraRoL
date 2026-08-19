/**
 * Tipe untuk skema database Rol.
 *
 * Ditulis manual agar prototype tidak bergantung pada langkah codegen.
 * Kalau nanti mau digenerate otomatis:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type FilmStyle = 'vintage' | 'original' | 'bw'
export type RevealMode = 'scheduled' | 'manual'

/** Hak unggah untuk tamu BARU. Tamu lama tidak terpengaruh saat mode diubah. */
export type UploadPolicy = 'open' | 'approval'

/*
 * Catatan: baris-baris tabel di bawah sengaja memakai `type`, bukan `interface`.
 * postgrest-js membatasi bentuk skema dengan `Record<string, unknown>`, dan
 * interface tidak punya implicit index signature sehingga akan ditolak, efeknya
 * tipe insert/update jatuh jadi `never` tanpa pesan error yang jelas.
 */

export type EventRow = {
  id: string
  host_user_id: string
  name: string
  film_style: FilmStyle
  reveal_mode: RevealMode
  /** null kalau reveal_mode === 'manual' */
  reveal_at: string | null
  is_revealed: boolean
  /** opsional: belum ada sebelum migration 0003, anggap 'open' kalau tidak ada */
  upload_policy?: UploadPolicy | null
  /** terisi kalau host mengarsipkan acara. null = aktif */
  archived_at?: string | null
  created_at: string
}

export type GuestRow = {
  id: string
  event_id: string
  device_id: string
  name: string
  /** opsional: belum ada sebelum migration 0003, anggap true kalau tidak ada */
  can_upload?: boolean | null
  /** terisi kalau host mengeluarkan tamu ini. null = aktif */
  removed_at?: string | null
  joined_at: string
}

/** Bentuk tamu yang aman ditampilkan ke sesama tamu: tanpa device_id. */
export interface GuestSummary {
  id: string
  name: string
  joinedAt: string
  canUpload: boolean
  removed: boolean
  photoCount: number
}

export type PhotoRow = {
  id: string
  event_id: string
  guest_id: string
  /** path foto mentah tanpa filter */
  storage_path: string
  /** path foto yang filternya sudah di-bake saat capture */
  filtered_storage_path: string
  /** versi kecil untuk grid. null untuk foto sebelum migration 0002 */
  thumb_storage_path?: string | null
  film_style_applied: FilmStyle
  is_deleted: boolean
  /** true hanya untuk foto yang tersembunyi karena tamunya dikeluarkan */
  hidden_by_removal?: boolean | null
  created_at: string
}

export type EventStatsRow = {
  event_id: string
  guest_count: number
  photo_count: number
}

/** Cukup untuk menentukan status reveal sebuah event. */
export type PublicEventLike = Pick<EventRow, 'id' | 'is_revealed' | 'reveal_at' | 'reveal_mode'>

/** Bentuk yang dikirim ke client untuk gallery, sudah termasuk signed URL. */
export interface GalleryPhoto {
  id: string
  guestName: string
  createdAt: string
  /** Versi penuh, dipakai lightbox, unduhan satuan, dan ZIP. */
  url: string
  /** Versi kecil untuk grid. Jatuh ke `url` kalau foto belum punya thumbnail. */
  thumbUrl: string
  filename: string
}

export type Database = {
  public: {
    Tables: {
      events: {
        Row: EventRow
        Insert: Omit<EventRow, 'id' | 'created_at' | 'is_revealed'> &
          Partial<Pick<EventRow, 'id' | 'created_at' | 'is_revealed'>>
        Update: Partial<EventRow>
        Relationships: []
      }
      guests: {
        Row: GuestRow
        Insert: Omit<GuestRow, 'id' | 'joined_at'> &
          Partial<Pick<GuestRow, 'id' | 'joined_at'>>
        Update: Partial<GuestRow>
        Relationships: []
      }
      photos: {
        Row: PhotoRow
        Insert: Omit<PhotoRow, 'id' | 'created_at' | 'is_deleted'> &
          Partial<Pick<PhotoRow, 'id' | 'created_at' | 'is_deleted'>>
        Update: Partial<PhotoRow>
        Relationships: []
      }
    }
    Views: {
      event_stats: {
        Row: EventStatsRow
        Relationships: []
      }
    }
    Functions: {
      event_is_revealed: {
        Args: { p_event_id: string }
        Returns: boolean
      }
    }
    Enums: {
      film_style: FilmStyle
      reveal_mode: RevealMode
    }
    CompositeTypes: Record<never, never>
  }
}
