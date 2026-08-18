export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Bahasa Indonesia jadi default: produk ini dirancang untuk acara di Indonesia. */
export const DEFAULT_LOCALE: Locale = 'id'

export const LOCALE_NAMES: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

const id = {
  common: {
    appName: 'CameraRol',
    back: 'Kembali',
    cancel: 'Batal',
    guest: 'Tamu',
    language: 'Bahasa',
  },

  meta: {
    homeTitle: 'CameraRol: kamera sekali pakai untuk acaramu',
    homeDescription:
      'Bagikan satu QR ke semua tamu. Mereka memotret, hasilnya terkunci, dan semuanya terbuka bersamaan saat acara usai.',
    login: 'Masuk | CameraRol',
    dashboard: 'Acara saya | CameraRol',
    newEvent: 'Buat acara | CameraRol',
    join: 'Gabung | CameraRol',
    camera: 'Kamera | CameraRol',
    locked: 'Menunggu reveal | CameraRol',
    gallery: 'Album | CameraRol',
  },

  landing: {
    signIn: 'Masuk sebagai host',
    title: 'Kamera sekali pakai, versi digital, untuk acaramu.',
    subtitle:
      'Tamu memotret sepuasnya lewat browser. Hasilnya terkunci sampai acara usai, lalu terbuka serentak jadi satu album bersama.',
    cta: 'Mulai buat acara',
    steps: [
      { title: 'Buat acara', detail: 'Beri nama, pilih film style, tentukan kapan foto boleh dibuka.' },
      { title: 'Bagikan satu QR', detail: 'Tamu scan, isi nama, langsung memotret. Tanpa instal, tanpa akun.' },
      { title: 'Buka bareng', detail: 'Saat waktunya tiba, semua foto muncul sekaligus jadi satu album.' },
    ],
  },

  login: {
    title: 'Selamat datang di CameraRol',
    subtitle: 'Buat acara dan bagikan momen, seperti kamera sekali pakai tapi digital.',
    google: 'Lanjutkan dengan Google',
    googleLoading: 'Menghubungkan…',
    withEmail: 'Masuk dengan Email',
    emailLabel: 'Alamat email',
    emailPlaceholder: 'kamu@email.com',
    sendLink: 'Kirim link masuk',
    sending: 'Mengirim…',
    sentTitle: 'Cek emailmu',
    sentBodyBefore: 'Link masuk sudah dikirim ke ',
    sentBodyAfter: '. Buka link itu di perangkat ini untuk melanjutkan.',
    hostOnly:
      'Login hanya untuk host. Tamu tidak perlu akun, cukup buka link atau scan QR yang kamu bagikan.',
    backHome: 'Kembali ke halaman utama',
    errors: {
      missing_code: 'Link tidak lengkap. Coba masuk sekali lagi.',
      exchange_failed: 'Link sudah dipakai atau kedaluwarsa. Kirim ulang, ya.',
      google_denied: 'Kamu membatalkan izin di Google. Coba lagi kalau berubah pikiran.',
      oauth_failed: 'Login lewat Google gagal. Coba lagi atau pakai email.',
      generic: 'Login bermasalah. Coba lagi.',
      invalidEmail: 'Masukkan alamat email yang valid.',
      googleUnreachable: 'Tidak bisa menghubungi Google. Coba lagi sebentar.',
    },
  },

  dashboard: {
    signOut: 'Keluar',
    title: 'Acara saya',
    subtitle: 'Tiap acara punya satu QR yang bisa dipakai semua tamu.',
    create: 'Buat acara',
    loadFailed: 'Gagal memuat acara',
    emptyTitle: 'Belum ada acara',
    emptyBody:
      'Buat acara pertamamu, lalu bagikan QR-nya ke tamu. Foto mereka akan terkunci sampai waktu reveal.',
    manualReveal: 'Dibuka manual oleh host',
    opensAt: (time: string) => `Terbuka ${time}`,
    revealed: 'Terbuka',
    locked: 'Terkunci',
    guestCount: (n: number) => `${n} tamu`,
    photoCount: (n: number) => `${n} foto`,
  },

  newEvent: {
    title: 'Buat acara',
    subtitle: 'Tamu tidak perlu instal apa pun. Mereka cukup scan QR, isi nama, lalu memotret.',
    nameTitle: 'Nama acara',
    nameDesc: 'Ini yang dilihat tamu saat membuka link.',
    namePlaceholder: 'Nikahan Dina & Raka',
    filmTitle: 'Film style',
    filmDesc: 'Semua foto di acara ini pakai tampilan yang sama. Bisa diganti nanti.',
    revealTitle: 'Kapan foto dibuka',
    revealDesc:
      'Sebelum waktu ini, tamu tidak bisa melihat foto siapa pun, termasuk fotonya sendiri.',
    modeScheduled: 'Terjadwal',
    modeScheduledDetail: 'Terbuka sendiri di waktu yang kamu tentukan.',
    modeManual: 'Manual',
    modeManualDetail: 'Kamu yang menekan tombol buka, kapan pun.',
    revealTimeLabel: 'Waktu reveal',
    timezoneNote: 'Mengikuti zona waktu perangkat ini.',
    pastWarning: 'Waktu reveal sudah lewat. Pilih waktu di masa depan.',
    submit: 'Buat acara & ambil QR',
    submitting: 'Membuat…',
    pickDateTime: 'Pilih tanggal & waktu',
    hourLabel: 'Jam reveal',
    hourAria: 'Jam',
    minuteAria: 'Menit',
    done: 'Selesai',
    loadingCalendar: 'Memuat kalender…',
    errors: {
      sessionExpired: 'Sesi habis. Coba masuk lagi.',
      nameRequired: 'Nama acara wajib diisi, maksimal 80 karakter.',
      unknownStyle: 'Film style tidak dikenal.',
      unknownMode: 'Mode reveal tidak dikenal.',
      pickReveal: 'Pilih waktu reveal dulu.',
      invalidReveal: 'Waktu reveal tidak valid.',
      mustBeFuture: 'Waktu reveal harus di masa depan.',
      createFailed: 'Gagal membuat acara.',
    },
  },

  eventDetail: {
    allEvents: 'Semua acara',
    created: 'Acara dibuat. Bagikan QR di bawah ke tamu-tamumu.',
    shareTitle: 'Bagikan ke tamu',
    shareDesc: 'Cetak QR-nya, atau sebar linknya. Tamu tidak perlu instal aplikasi atau login.',
    copyLink: 'Salin link',
    copied: 'Tersalin',
    copiedToast: 'Link disalin',
    copyFailed: 'Gagal menyalin. Salin manual dari kotak di atas, ya.',
    downloadQr: 'Unduh QR',
    share: 'Bagikan',
    shareText: (name: string) => `Ikut foto di ${name} pakai CameraRol`,
    statGuests: 'Tamu bergabung',
    statPhotos: 'Foto masuk',
    statAvg: 'Rata-rata per tamu',
    statusTitle: 'Status',
    statusRevealed: 'Semua tamu sudah bisa melihat dan mengunduh foto.',
    statusLocked: 'Foto tersimpan aman dan belum bisa dilihat siapa pun kecuali kamu.',
    autoOpenAt: (time: string) => `Terbuka otomatis ${time}`,
    manualNote: 'Acara ini mode manual. Foto terbuka begitu kamu menekan tombol di bawah.',
    openNow: 'Buka foto sekarang',
    confirmTitle: 'Buka foto sekarang?',
    confirmDesc:
      'Semua tamu langsung bisa melihat dan mengunduh seluruh foto di acara ini. Tindakan ini tidak bisa dibatalkan lewat aplikasi.',
    confirmYes: 'Ya, buka sekarang',
    opening: 'Membuka…',
    filmTitle: 'Film style',
    filmDesc:
      'Berlaku untuk foto yang diambil setelah ini. Foto lama tetap memakai style saat dipotret. File mentahnya tersimpan, jadi bisa dirender ulang nanti.',
    photosTitle: (n: number) => `Foto masuk (${n})`,
    viewGallery: 'Lihat gallery tamu',
    photosEmpty: 'Belum ada foto masuk. Foto akan muncul di sini begitu tamu mulai memotret.',
    deletePhoto: 'Hapus',
    deleteTitle: 'Hapus foto ini?',
    deleteDesc:
      'Foto tidak akan muncul di gallery tamu. File aslinya tetap tersimpan di storage, jadi masih bisa dipulihkan lewat database kalau salah hapus.',
    deleting: 'Menghapus…',
    styleUpdated: 'Film style diperbarui',
    openedToast: 'Foto sudah terbuka untuk semua tamu',
    deletedToast: 'Foto dihapus',
    photoBy: (name: string) => `Foto oleh ${name}`,
  },

  join: {
    invitedTo: 'Kamu diundang ke',
    formTitle: 'Isi namamu dulu',
    formDescBefore: 'Tanpa akun, tanpa instal apa pun. Foto-fotomu pakai film style ',
    nameLabel: 'Namamu',
    namePlaceholder: 'Dina',
    nameNote: 'Nama ini muncul di bawah foto-fotomu saat album dibuka.',
    start: 'Mulai memotret',
    starting: 'Menyiapkan kamera…',
    resuming: 'Mengecek perangkat ini…',
    connectError: 'Tidak bisa terhubung. Cek koneksimu, lalu coba lagi.',
    joinFailed: 'Gagal bergabung. Coba lagi.',
    noteRevealed: 'Album acara ini sudah dibuka. Foto barumu akan langsung terlihat semua orang.',
    noteScheduled: (time: string) => `Semua foto terkunci sampai ${time}, lalu terbuka serentak.`,
    noteManual: 'Semua foto terkunci sampai host membukanya, lalu terbuka serentak.',
  },

  camera: {
    photoCount: (n: number) => `${n} foto`,
    album: 'Album',
    starting: 'Menyalakan kamera…',
    saving: 'Menyimpan foto…',
    lockedNote: 'Fotomu langsung terkunci. Belum ada yang bisa melihatnya, termasuk kamu.',
    switchCamera: 'Ganti kamera depan/belakang',
    chooseCamera: 'Pilih modul kamera',
    lensBack: 'Belakang',
    lensFront: 'Depan',
    lensUltraWide: 'Ultra-wide',
    lensWide: 'Wide',
    lensMain: 'Utama',
    lensTele: 'Telefoto',
    lensNumbered: (n: number) => `Kamera ${n}`,
    shutter: 'Ambil foto',
    lastPhoto: 'Foto terakhir',
    reload: 'Muat ulang',
    savedToast: 'Tersimpan & terkunci',
    saveFailedToast: 'Foto gagal tersimpan. Coba lagi.',
    captureFailed: 'Foto gagal diambil.',
    notReady: 'Kamera belum siap.',
    errors: {
      deniedTitle: 'Izin kamera ditolak',
      deniedDetail:
        'Buka pengaturan izin situs di browser, aktifkan kamera untuk halaman ini, lalu muat ulang.',
      notFoundTitle: 'Kamera tidak ditemukan',
      notFoundDetail: 'Perangkat ini sepertinya tidak punya kamera yang bisa dipakai browser.',
      inUseTitle: 'Kamera sedang dipakai',
      inUseDetail: 'Tutup aplikasi lain yang memakai kamera, lalu muat ulang halaman ini.',
      genericTitle: 'Kamera gagal dinyalakan',
      genericDetail: 'Coba muat ulang halaman. Kalau masih gagal, buka lewat browser lain.',
      unavailableTitle: 'Kamera tidak tersedia di halaman ini',
      unsupportedDetail: 'Browser ini tidak mendukung akses kamera. Coba Chrome atau Safari versi terbaru.',
      insecureDetail:
        'Kamera hanya bisa diakses lewat HTTPS atau localhost. Buka halaman ini dari alamat https://, bukan dari alamat IP.',
    },
  },

  locked: {
    notOpenYet: 'Album belum dibuka',
    waitingManual:
      'Menunggu host membuka album. Halaman ini akan terbuka sendiri begitu itu terjadi.',
    opensAt: (time: string) =>
      `Semua foto dari semua tamu terbuka serentak pada ${time}.`,
    opensManual:
      'Semua foto dari semua tamu terbuka serentak begitu host menekan tombol buka.',
    untilThen: 'Sampai saat itu belum ada yang bisa melihatnya, termasuk kamu.',
    continueShooting: 'Lanjut memotret',
    joinAndShoot: 'Gabung & mulai memotret',
  },

  gallery: {
    openAlbum: 'Album terbuka',
    summary: (photos: number, guests: number) => `${photos} foto dari ${guests} tamu`,
    downloadAll: 'Unduh semua (ZIP)',
    preparing: (percent: number) => `Menyiapkan… ${percent}%`,
    downloadedToast: (n: number) => `${n} foto diunduh`,
    zipFailed: 'Gagal membuat ZIP. Coba unduh beberapa foto satu per satu.',
    downloadFailed: 'Gagal mengunduh foto. Coba lagi.',
    download: 'Unduh',
    previous: 'Foto sebelumnya',
    next: 'Foto berikutnya',
    position: (index: number, total: number) => `${index} dari ${total}`,
    emptyBody: 'Album sudah dibuka, tapi belum ada foto sama sekali di acara ini.',
    firstPhoto: 'Ambil foto pertama',
    joinAndShoot: 'Gabung & mulai memotret',
    backToCamera: 'Kembali memotret',
  },

  notFound: {
    title: 'Acara tidak ditemukan',
    body: 'Link atau QR-nya mungkin salah ketik, atau acaranya sudah dihapus host. Coba minta link terbaru ke yang mengundangmu.',
    home: 'Ke halaman utama',
  },

  countdown: { days: 'hari', hours: 'jam', minutes: 'menit', seconds: 'detik' },

  filmStyles: {
    vintage: {
      label: 'Vintage',
      description: 'Hangat, sedikit pudar, seperti film 35mm yang kelamaan di laci.',
    },
    original: { label: 'Original', description: 'Warna apa adanya, cuma dinaikkan kontrasnya sedikit.' },
    bw: { label: 'Black & White', description: 'Hitam putih berkontras tinggi dengan butiran kasar.' },
  },

  api: {
    eventNotFound: 'Acara tidak ditemukan.',
    invalidRequest: 'Permintaan tidak valid.',
    deviceUnknown: 'Perangkat tidak dikenali.',
    nameRequired: 'Nama wajib diisi, maksimal 40 karakter.',
    joinFailed: 'Gagal bergabung. Coba lagi.',
    notJoined: 'Kamu belum bergabung ke acara ini.',
    photoIncomplete: 'Foto tidak lengkap.',
    photoEmpty: 'Foto kosong.',
    photoTooLarge: 'Foto terlalu besar.',
    uploadFailed: 'Gagal mengunggah foto.',
    saveFailed: 'Gagal menyimpan foto.',
  },
}

/**
 * `satisfies typeof id` bukan sekadar formalitas: ia membuat build GAGAL kalau
 * ada kunci yang lupa diterjemahkan atau bentuk fungsinya tidak cocok. Tanpa
 * itu, string yang terlewat baru ketahuan saat pengguna melihat teks kosong.
 */
const en = {
  common: {
    appName: 'CameraRol',
    back: 'Back',
    cancel: 'Cancel',
    guest: 'Guest',
    language: 'Language',
  },

  meta: {
    homeTitle: 'CameraRol: a disposable camera for your event',
    homeDescription:
      'Share one QR code with every guest. They shoot, the photos stay locked, and everything opens together when the event ends.',
    login: 'Sign in | CameraRol',
    dashboard: 'My events | CameraRol',
    newEvent: 'New event | CameraRol',
    join: 'Join | CameraRol',
    camera: 'Camera | CameraRol',
    locked: 'Waiting for reveal | CameraRol',
    gallery: 'Album | CameraRol',
  },

  landing: {
    signIn: 'Sign in as host',
    title: 'A disposable camera, reimagined, for your event.',
    subtitle:
      'Guests shoot freely from their browser. Photos stay locked until the event ends, then open all at once as one shared album.',
    cta: 'Create your event',
    steps: [
      { title: 'Create an event', detail: 'Name it, pick a film style, decide when photos may open.' },
      { title: 'Share one QR', detail: 'Guests scan, type a name, and start shooting. No install, no account.' },
      { title: 'Open together', detail: 'When the time comes, every photo appears at once as one album.' },
    ],
  },

  login: {
    title: 'Welcome to CameraRol',
    subtitle: 'Create an event and share the moment, like a disposable camera but digital.',
    google: 'Continue with Google',
    googleLoading: 'Connecting…',
    withEmail: 'Sign in with Email',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@email.com',
    sendLink: 'Send sign-in link',
    sending: 'Sending…',
    sentTitle: 'Check your email',
    sentBodyBefore: 'A sign-in link is on its way to ',
    sentBodyAfter: '. Open it on this device to continue.',
    hostOnly:
      'Signing in is for hosts only. Guests need no account. They just open the link or scan the QR you share.',
    backHome: 'Back to home',
    errors: {
      missing_code: 'That link was incomplete. Please try signing in again.',
      exchange_failed: 'That link was already used or has expired. Send a new one.',
      google_denied: 'You cancelled the Google permission. Try again if you change your mind.',
      oauth_failed: 'Google sign-in failed. Try again or use email instead.',
      generic: 'Something went wrong signing in. Please try again.',
      invalidEmail: 'Enter a valid email address.',
      googleUnreachable: 'Could not reach Google. Please try again in a moment.',
    },
  },

  dashboard: {
    signOut: 'Sign out',
    title: 'My events',
    subtitle: 'Each event has one QR code that every guest can use.',
    create: 'New event',
    loadFailed: 'Could not load your events',
    emptyTitle: 'No events yet',
    emptyBody:
      'Create your first event, then share its QR with guests. Their photos stay locked until the reveal.',
    manualReveal: 'Opened manually by the host',
    opensAt: (time: string) => `Opens ${time}`,
    revealed: 'Open',
    locked: 'Locked',
    guestCount: (n: number) => `${n} ${n === 1 ? 'guest' : 'guests'}`,
    photoCount: (n: number) => `${n} ${n === 1 ? 'photo' : 'photos'}`,
  },

  newEvent: {
    title: 'New event',
    subtitle: 'Guests install nothing. They scan the QR, type a name, and start shooting.',
    nameTitle: 'Event name',
    nameDesc: 'This is what guests see when they open the link.',
    namePlaceholder: "Dina & Raka's wedding",
    filmTitle: 'Film style',
    filmDesc: 'Every photo in this event shares the same look. You can change it later.',
    revealTitle: 'When photos open',
    revealDesc: 'Until then, no guest can see anyone’s photos, not even their own.',
    modeScheduled: 'Scheduled',
    modeScheduledDetail: 'Opens by itself at the time you choose.',
    modeManual: 'Manual',
    modeManualDetail: 'You press the button whenever you like.',
    revealTimeLabel: 'Reveal time',
    timezoneNote: 'Follows this device’s time zone.',
    pastWarning: 'That time has already passed. Pick a time in the future.',
    submit: 'Create event & get QR',
    submitting: 'Creating…',
    pickDateTime: 'Pick date & time',
    hourLabel: 'Reveal time',
    hourAria: 'Hour',
    minuteAria: 'Minute',
    done: 'Done',
    loadingCalendar: 'Loading calendar…',
    errors: {
      sessionExpired: 'Your session expired. Please sign in again.',
      nameRequired: 'An event name is required, up to 80 characters.',
      unknownStyle: 'Unknown film style.',
      unknownMode: 'Unknown reveal mode.',
      pickReveal: 'Pick a reveal time first.',
      invalidReveal: 'That reveal time is not valid.',
      mustBeFuture: 'The reveal time must be in the future.',
      createFailed: 'Could not create the event.',
    },
  },

  eventDetail: {
    allEvents: 'All events',
    created: 'Event created. Share the QR below with your guests.',
    shareTitle: 'Share with guests',
    shareDesc: 'Print the QR or send the link. Guests install nothing and sign in to nothing.',
    copyLink: 'Copy link',
    copied: 'Copied',
    copiedToast: 'Link copied',
    copyFailed: 'Could not copy. Please copy it manually from the box above.',
    downloadQr: 'Download QR',
    share: 'Share',
    shareText: (name: string) => `Join the photos at ${name} with CameraRol`,
    statGuests: 'Guests joined',
    statPhotos: 'Photos in',
    statAvg: 'Average per guest',
    statusTitle: 'Status',
    statusRevealed: 'Every guest can now view and download the photos.',
    statusLocked: 'Photos are stored safely and nobody but you can see them yet.',
    autoOpenAt: (time: string) => `Opens automatically ${time}`,
    manualNote: 'This event is manual. Photos open the moment you press the button below.',
    openNow: 'Open photos now',
    confirmTitle: 'Open the photos now?',
    confirmDesc:
      'Every guest will immediately be able to view and download all photos in this event. This cannot be undone from the app.',
    confirmYes: 'Yes, open now',
    opening: 'Opening…',
    filmTitle: 'Film style',
    filmDesc:
      'Applies to photos taken from now on. Older photos keep the style they were shot with. Their raw files are stored, so they can be re-rendered later.',
    photosTitle: (n: number) => `Photos in (${n})`,
    viewGallery: 'View guest gallery',
    photosEmpty: 'No photos yet. They will appear here as soon as guests start shooting.',
    deletePhoto: 'Delete',
    deleteTitle: 'Delete this photo?',
    deleteDesc:
      'It will disappear from the guest gallery. The original file stays in storage, so it can still be restored from the database if this was a mistake.',
    deleting: 'Deleting…',
    styleUpdated: 'Film style updated',
    openedToast: 'Photos are now open to every guest',
    deletedToast: 'Photo deleted',
    photoBy: (name: string) => `Photo by ${name}`,
  },

  join: {
    invitedTo: 'You are invited to',
    formTitle: 'First, your name',
    formDescBefore: 'No account, nothing to install. Your photos use the film style ',
    nameLabel: 'Your name',
    namePlaceholder: 'Dina',
    nameNote: 'This name appears under your photos when the album opens.',
    start: 'Start shooting',
    starting: 'Preparing camera…',
    resuming: 'Checking this device…',
    connectError: 'Could not connect. Check your connection and try again.',
    joinFailed: 'Could not join. Please try again.',
    noteRevealed: 'This album is already open. Your new photos will be visible to everyone right away.',
    noteScheduled: (time: string) => `All photos stay locked until ${time}, then open together.`,
    noteManual: 'All photos stay locked until the host opens them, then open together.',
  },

  camera: {
    photoCount: (n: number) => `${n} ${n === 1 ? 'photo' : 'photos'}`,
    album: 'Album',
    starting: 'Starting camera…',
    saving: 'Saving photo…',
    lockedNote: 'Your photo is locked instantly. Nobody can see it yet, not even you.',
    switchCamera: 'Switch front/back camera',
    chooseCamera: 'Choose camera module',
    lensBack: 'Back',
    lensFront: 'Front',
    lensUltraWide: 'Ultra-wide',
    lensWide: 'Wide',
    lensMain: 'Main',
    lensTele: 'Telephoto',
    lensNumbered: (n: number) => `Camera ${n}`,
    shutter: 'Take photo',
    lastPhoto: 'Last photo',
    reload: 'Reload',
    savedToast: 'Saved & locked',
    saveFailedToast: 'The photo could not be saved. Try again.',
    captureFailed: 'Could not capture the photo.',
    notReady: 'The camera is not ready yet.',
    errors: {
      deniedTitle: 'Camera permission denied',
      deniedDetail:
        'Open your browser’s site permissions, allow the camera for this page, then reload.',
      notFoundTitle: 'No camera found',
      notFoundDetail: 'This device does not seem to have a camera the browser can use.',
      inUseTitle: 'Camera is busy',
      inUseDetail: 'Close other apps using the camera, then reload this page.',
      genericTitle: 'Could not start the camera',
      genericDetail: 'Try reloading. If it still fails, open this page in another browser.',
      unavailableTitle: 'Camera is unavailable on this page',
      unsupportedDetail:
        'This browser does not support camera access. Try the latest Chrome or Safari.',
      insecureDetail:
        'Cameras only work over HTTPS or localhost. Open this page from an https:// address, not an IP address.',
    },
  },

  locked: {
    notOpenYet: 'The album is not open yet',
    waitingManual: 'Waiting for the host to open the album. This page will open by itself when they do.',
    opensAt: (time: string) => `Every photo from every guest opens together on ${time}.`,
    opensManual: 'Every photo from every guest opens together the moment the host presses open.',
    untilThen: 'Until then nobody can see them, not even you.',
    continueShooting: 'Keep shooting',
    joinAndShoot: 'Join & start shooting',
  },

  gallery: {
    openAlbum: 'Album open',
    summary: (photos: number, guests: number) =>
      `${photos} ${photos === 1 ? 'photo' : 'photos'} from ${guests} ${guests === 1 ? 'guest' : 'guests'}`,
    downloadAll: 'Download all (ZIP)',
    preparing: (percent: number) => `Preparing… ${percent}%`,
    downloadedToast: (n: number) => `${n} ${n === 1 ? 'photo' : 'photos'} downloaded`,
    zipFailed: 'Could not build the ZIP. Try downloading a few photos individually.',
    downloadFailed: 'Could not download that photo. Try again.',
    download: 'Download',
    previous: 'Previous photo',
    next: 'Next photo',
    position: (index: number, total: number) => `${index} of ${total}`,
    emptyBody: 'The album is open, but there are no photos in this event yet.',
    firstPhoto: 'Take the first photo',
    joinAndShoot: 'Join & start shooting',
    backToCamera: 'Back to shooting',
  },

  notFound: {
    title: 'Event not found',
    body: 'The link or QR may be mistyped, or the host deleted the event. Ask whoever invited you for a fresh link.',
    home: 'Go to home',
  },

  countdown: { days: 'days', hours: 'hours', minutes: 'min', seconds: 'sec' },

  filmStyles: {
    vintage: {
      label: 'Vintage',
      description: 'Warm and slightly faded, like 35mm film left too long in a drawer.',
    },
    original: { label: 'Original', description: 'Colours as they are, with a touch more contrast.' },
    bw: { label: 'Black & White', description: 'High-contrast monochrome with coarse grain.' },
  },

  api: {
    eventNotFound: 'Event not found.',
    invalidRequest: 'Invalid request.',
    deviceUnknown: 'Device not recognised.',
    nameRequired: 'A name is required, up to 40 characters.',
    joinFailed: 'Could not join. Please try again.',
    notJoined: 'You have not joined this event yet.',
    photoIncomplete: 'The photo is incomplete.',
    photoEmpty: 'The photo is empty.',
    photoTooLarge: 'The photo is too large.',
    uploadFailed: 'Could not upload the photo.',
    saveFailed: 'Could not save the photo.',
  },
} satisfies typeof id

export type Dictionary = typeof id

export const dictionaries: Record<Locale, Dictionary> = { id, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}
