/**
 * Ilustrasi pembuka halaman login: sepotong strip film 35mm.
 *
 * Gradien di dalam bingkainya sengaja sama persis dengan swatch di
 * FilmStylePicker, supaya bahasa visualnya nyambung — orang yang pertama
 * melihat halaman login akan mengenali bentuk yang sama saat memilih film style.
 */
export function FilmStripMark({ className }: { className?: string }) {
  const sprocketRows = [30, 48, 66, 84, 102, 120, 138, 156]
  const frames = [
    { y: 32, opacity: 1 },
    { y: 80, opacity: 0.82 },
    { y: 128, opacity: 0.55 },
  ]

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Ilustrasi strip film"
    >
      <defs>
        <linearGradient id="rol-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5C98F" />
          <stop offset="35%" stopColor="#D9825A" />
          <stop offset="68%" stopColor="#7A4A63" />
          <stop offset="100%" stopColor="#23303F" />
        </linearGradient>

        <radialGradient id="rol-halo" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C08A3E" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#C08A3E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo hangat supaya strip tidak terasa "menempel" di latar putih */}
      <circle cx="100" cy="96" r="92" fill="url(#rol-halo)" />

      <rect x="54" y="20" width="92" height="160" rx="16" fill="#241A08" />

      {sprocketRows.map((y) => (
        <g key={y}>
          <rect x="60" y={y} width="8" height="10" rx="2" fill="#FAFAF9" opacity="0.85" />
          <rect x="132" y={y} width="8" height="10" rx="2" fill="#FAFAF9" opacity="0.85" />
        </g>
      ))}

      {frames.map((frame) => (
        <rect
          key={frame.y}
          x="74"
          y={frame.y}
          width="52"
          height="42"
          rx="5"
          fill="url(#rol-frame)"
          opacity={frame.opacity}
        />
      ))}
    </svg>
  )
}
