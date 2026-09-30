import React from 'react'

/**
 * 最近 7 天的圆点。
 * 四种样子：点亮（发光实心）、休憩（虚线圈）、安静（很暗的实心）、今天（描边圈）。
 * 没有任何"红叉"或"失败"的呈现方式。
 */
export function DayDots({ days = [], onPick, compact = false }) {
  const today = days.length ? days[days.length - 1].date : null
  return (
    <div className={`dots ${compact ? 'dots--compact' : ''}`}>
      {days.map((d) => {
        const isToday = d.date === today
        const cls = [
          'dots__dot',
          `is-${d.status}`,
          isToday ? 'is-today' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const title = d.status === 'lit' ? '点亮' : d.status === 'rest' ? '休憩' : d.status === 'progress' ? '读了一部分' : d.status === 'today' ? '今天' : '安静的一天'
        return (
          <button
            key={d.date}
            type="button"
            className={cls}
            title={title}
            aria-label={title}
            onClick={() => onPick && onPick(d.date)}
          >
            <span className="dots__core" />
            <span className="dots__label">{d.date.slice(8)}</span>
          </button>
        )
      })}
    </div>
  )
}
