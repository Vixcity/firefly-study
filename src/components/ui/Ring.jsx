import React from 'react'

/**
 * 环形进度：计时页的目标环、光合树/等级的进度都用它。
 * 用 strokeDasharray + 旋转实现，纯 SVG，不用 canvas。
 */
export function Ring({
  size = 220,
  stroke = 8,
  progress = 0,
  children,
  color = 'var(--fs-accent)',
  track = 'rgba(255,255,255,0.07)',
  glow = true,
  ticks = 0,
  className = '',
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress || 0))
  const center = size / 2

  return (
    <div className={`ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={center} cy={center} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {ticks > 0
          ? Array.from({ length: ticks }, (_, i) => {
              const a = (i / ticks) * Math.PI * 2 - Math.PI / 2
              const inner = r - stroke / 2 - 2
              const outer = r - stroke / 2
              return (
                <line
                  key={i}
                  x1={center + Math.cos(a) * inner}
                  y1={center + Math.sin(a) * inner}
                  x2={center + Math.cos(a) * outer}
                  y2={center + Math.sin(a) * outer}
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              )
            })
          : null}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 620ms cubic-bezier(0.16,1,0.3,1)',
            filter: glow ? 'drop-shadow(0 0 6px rgba(255,217,138,0.55))' : 'none',
          }}
        />
      </svg>
      <div className="ring__inner">{children}</div>
    </div>
  )
}
