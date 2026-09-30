import React, { memo } from 'react'

/**
 * 光合树 —— 随累计阅读时长成长的陪伴物。
 *
 * 只随累计总量成长，永不枯萎退化：
 *   0 种子 → 1 发芽 → 2 抽枝 → 3 长叶 → 4 含苞 → 5 初绽
 *   → 6 开花 → 7 繁花 → 8 光果 → 9 星辉树
 * 久未阅读只是"睡着"（降低饱和度），回来继续生长。
 */

const TRUNK = [
  { d: 'M60 112 C 58.5 104, 61.5 98, 60 92', min: 1 },
  { d: 'M60 92 C 58.5 84, 61.5 78, 60 70', min: 2 },
  { d: 'M60 70 C 58.5 62, 61.5 56, 60 48', min: 4 },
  { d: 'M60 48 C 59 42, 61 38, 60.5 34', min: 7 },
]

const BRANCHES = [
  { d: 'M60 96 C 51 92, 45 88, 38 82', min: 2 },
  { d: 'M60 88 C 69 84, 75 80, 82 74', min: 2 },
  { d: 'M60 78 C 51 74, 45 70, 40 62', min: 5 },
  { d: 'M60 64 C 69 60, 75 56, 80 48', min: 5 },
  { d: 'M60 56 C 52 52, 47 48, 44 40', min: 7 },
  { d: 'M60 50 C 68 46, 72 42, 74 34', min: 7 },
  { d: 'M60 40 C 55 37, 51 34, 48 30', min: 8 },
  { d: 'M60 40 C 65 37, 69 34, 72 30', min: 8 },
]

const LEAVES = [
  { x: 38, y: 82, rot: -28, min: 3 },
  { x: 43, y: 86, rot: 12, min: 3 },
  { x: 82, y: 74, rot: 26, min: 3 },
  { x: 77, y: 78, rot: -14, min: 3 },
  { x: 40, y: 62, rot: -34, min: 5 },
  { x: 45, y: 66, rot: 8, min: 5 },
  { x: 80, y: 48, rot: 30, min: 5 },
  { x: 75, y: 52, rot: -10, min: 5 },
  { x: 44, y: 40, rot: -40, min: 7 },
  { x: 49, y: 42, rot: 6, min: 7 },
  { x: 74, y: 34, rot: 36, min: 7 },
  { x: 69, y: 36, rot: -6, min: 7 },
  { x: 48, y: 30, rot: -30, min: 8 },
  { x: 72, y: 30, rot: 30, min: 8 },
  { x: 57, y: 27, rot: -8, min: 8 },
  { x: 64, y: 26, rot: 14, min: 8 },
  { x: 54, y: 44, rot: -18, min: 9 },
  { x: 66, y: 42, rot: 20, min: 9 },
]

const BUDS = [
  { x: 38, y: 80, min: 4 },
  { x: 82, y: 72, min: 4 },
  { x: 40, y: 60, min: 5 },
  { x: 80, y: 46, min: 5 },
]

const BLOOMS = [
  { x: 52, y: 58, min: 5, scale: 0.86 },
  { x: 70, y: 52, min: 6, scale: 1 },
  { x: 44, y: 70, min: 6, scale: 0.9 },
  { x: 78, y: 60, min: 7, scale: 0.94 },
  { x: 60, y: 34, min: 7, scale: 1 },
  { x: 37, y: 50, min: 8, scale: 0.88 },
  { x: 74, y: 32, min: 8, scale: 0.92 },
]

const BERRIES = [
  { x: 42, y: 46, min: 8 },
  { x: 78, y: 40, min: 8 },
  { x: 56, y: 24, min: 9 },
  { x: 66, y: 22, min: 9 },
  { x: 48, y: 34, min: 9 },
]

/** 五瓣花 */
function Bloom({ x, y, scale = 1, glow }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {glow ? <circle r="7" className="tree__bloom-glow" /> : null}
      {petals.map((a) => {
        const rad = (a * Math.PI) / 180
        return <circle key={a} cx={Math.cos(rad) * 3.3} cy={Math.sin(rad) * 3.3} r="2.5" className="tree__petal" />
      })}
      <circle r="1.7" className="tree__bloom-core" />
    </g>
  )
}

function PhotoTreeBase({ stage = 0, sleeping = false, className = '' }) {
  const on = (min) => stage >= min
  const canopy = on(2)

  return (
    <svg
      viewBox="0 0 120 140"
      className={`tree ${sleeping ? 'tree--sleeping' : ''} ${className}`}
      role="img"
      aria-label={`光合树，当前第 ${stage} 阶`}
    >
      <defs>
        <radialGradient id="tree-halo" cx="50%" cy="45%" r="52%">
          <stop offset="0%" stopColor="var(--fs-leaf)" stopOpacity="0.34" />
          <stop offset="55%" stopColor="var(--fs-bloom)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--fs-bloom)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tree-pot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c4a38" />
          <stop offset="100%" stopColor="#33271d" />
        </linearGradient>
        <linearGradient id="tree-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3a2b" />
          <stop offset="100%" stopColor="#2b2018" />
        </linearGradient>
      </defs>

      {/* 花盆先画：植物要长在土面之上，不能被盆挡住 */}
      <path d="M38 112 h44 l-5 21 a4 4 0 0 1 -4 3 h-26 a4 4 0 0 1 -4 -3 z" fill="url(#tree-pot)" />
      <ellipse cx="60" cy="112" rx="22" ry="4.6" fill="url(#tree-soil)" />

      {/* 树冠光晕：阶数越高越亮 */}
      {on(1) ? <circle cx="60" cy="62" r="54" fill="url(#tree-halo)" opacity={0.28 + stage * 0.07} /> : null}

      <g className={canopy && !sleeping ? 'fs-sway' : ''} style={{ transformOrigin: '60px 112px' }}>
        {/* 枝干 */}
        {TRUNK.filter((t) => on(t.min)).map((t) => (
          <path key={t.d} d={t.d} className="tree__trunk" />
        ))}
        {BRANCHES.filter((b) => on(b.min)).map((b) => (
          <path key={b.d} d={b.d} className="tree__branch" />
        ))}

        {/* 叶片 */}
        {LEAVES.filter((l) => on(l.min)).map((l) => (
          <ellipse
            key={`${l.x}-${l.y}`}
            cx={l.x}
            cy={l.y}
            rx="7.2"
            ry="3.6"
            transform={`rotate(${l.rot} ${l.x} ${l.y})`}
            className="tree__leaf"
          />
        ))}

        {/* 花苞 */}
        {BUDS.filter((b) => on(b.min)).map((b) => (
          <circle key={`${b.x}-${b.y}`} cx={b.x} cy={b.y} r="2.4" className="tree__bud" />
        ))}

        {/* 花朵 */}
        {BLOOMS.filter((b) => on(b.min)).map((b) => (
          <Bloom key={`${b.x}-${b.y}`} x={b.x} y={b.y} scale={b.scale} glow={on(6)} />
        ))}

        {/* 光果 */}
        {BERRIES.filter((b) => on(b.min)).map((b) => (
          <g key={`${b.x}-${b.y}`} className="fs-twinkle" style={{ '--fs-twinkle-dur': '3.4s' }}>
            <circle cx={b.x} cy={b.y} r="4.6" className="tree__berry-glow" />
            <circle cx={b.x} cy={b.y} r="2" className="tree__berry" />
          </g>
        ))}

        {/* 星辉树：落在枝头的小光点 */}
        {on(9)
          ? [
              [46, 26],
              [70, 44],
              [52, 68],
              [78, 30],
            ].map(([x, y], i) => (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="1.6"
                className="tree__perch fs-twinkle"
                style={{ '--fs-twinkle-dur': `${2.6 + i * 0.5}s`, animationDelay: `${i * 0.4}s` }}
              />
            ))
          : null}
      </g>

      {/* 第 0 阶：土面上的一颗种子 + 一点新芽，画在盆之上才看得见 */}
      {stage === 0 ? (
        <g className={sleeping ? '' : 'fs-breathe'} style={{ '--fs-breathe-dur': '3.6s' }}>
          <circle cx="60" cy="104" r="5" className="tree__seed-glow" />
          <circle cx="60" cy="104" r="2.6" className="tree__seed" />
          <path d="M60 103 C 58.6 99.5, 60 97.5, 60 95" className="tree__sprout" />
        </g>
      ) : null}
      {on(1) ? <circle cx="60" cy="110" r="2.2" className="tree__seed-mark" /> : null}
    </svg>
  )
}

export const PhotoTree = memo(PhotoTreeBase)
