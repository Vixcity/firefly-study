import React, { useMemo } from 'react'
import { formatDurationTight } from '../../lib/format'

/**
 * 每日阅读时长柱状图。
 * 点亮的柱子会发光，安静的日子只留一根很矮的底座 —— 不批评，只是记录。
 */
export function BarChart({ data = [], height = 96, showLabels = true, labelEvery = 1 }) {
  const max = useMemo(() => Math.max(60, ...data.map((d) => d.totalSec || 0)), [data])

  return (
    <div className="bars" style={{ '--bars-h': `${height}px` }}>
      {data.map((d, i) => {
        const ratio = Math.max(0, Math.min(1, (d.totalSec || 0) / max))
        const h = d.totalSec > 0 ? Math.max(6, ratio * 100) : 3
        const showLabel = showLabels && i % labelEvery === 0
        return (
          <div className="bars__col" key={d.date}>
            <div className="bars__track">
              <div
                className={`bars__bar ${d.lit ? 'is-lit' : ''} ${d.rested ? 'is-rest' : ''}`}
                style={{ height: `${h}%` }}
                title={`${d.date} · ${d.totalSec ? formatDurationTight(d.totalSec) : '安静的一天'}`}
              />
            </div>
            {showLabel ? (
              <span className="bars__label">{Number(d.date.slice(8, 10))}</span>
            ) : (
              <span className="bars__label" />
            )}
          </div>
        )
      })}
    </div>
  )
}
