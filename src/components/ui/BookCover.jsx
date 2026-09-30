import React from 'react'
import { seedOf } from '../../lib/id'

/** 书籍封面：由书名种子生成渐变，同一本书永远同一个封面 */
export function BookCover({ title = '', size = 60, className = '' }) {
  const seed = seedOf(title || '未命名')
  const h = seed % 360
  const h2 = (h + 26) % 360
  const scale = size / 60
  const fontSize = 9 * Math.min(1.25, Math.max(0.9, scale))
  // 竖排文字空间有限：先把书名压到放得下的长度，避免从中间截断半个字
  const MAX_CHARS = 6
  const shown = title.length > MAX_CHARS ? `${title.slice(0, MAX_CHARS - 1)}…` : title
  return (
    <div
      className={`cover ${className}`}
      style={{
        width: `${44 * scale}px`,
        height: `${size}px`,
        background: `linear-gradient(158deg, hsl(${h} 30% 36%) 0%, hsl(${h2} 34% 19%) 100%)`,
      }}
      aria-hidden="true"
    >
      <span className="cover__title" style={{ fontSize: `${fontSize}px` }}>
        {shown}
      </span>
    </div>
  )
}
