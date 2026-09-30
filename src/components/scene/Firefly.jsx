import React, { memo } from 'react'
import { makeRng, rngRange } from '../../lib/rand'

/**
 * 一只萤火虫。
 * 位置与节奏由日期种子的伪随机数决定，所以刷新后不会乱跑。
 * `still` 用于久远的萤火虫：只保留静态微光，省掉动画开销。
 */
function FireflyBase({ date, size = 8, still = false, isToday = false, drift = 'a', delay = 0 }) {
  const rng = makeRng(`ff-${date}`)
  const top = rngRange(rng, 10, 76)
  // 往左侧偏一点（书房区域），把右侧的窗户和光合树留出来
  const left = 3 + Math.pow(rng(), 1.45) * 84
  const core = size + rngRange(rng, -1.6, 2.4)
  const dur = rngRange(rng, 17, 30)
  const breatheDur = rngRange(rng, 2.6, 4.8)
  const offset = delay || -rngRange(rng, 0, dur)

  return (
    <span
      className={`ff ${still ? 'ff--still' : ''} ${isToday ? 'ff--today' : ''}`}
      style={{ top: `${top}%`, left: `${left}%` }}
    >
      <span
        className={still ? 'ff__drift' : `ff__drift fs-drift-${drift}`}
        style={{ '--fs-drift-dur': `${dur}s`, animationDelay: `${offset}s` }}
      >
        <span
          className={still ? 'ff__core' : 'ff__core fs-breathe'}
          style={{
            width: `${core}px`,
            height: `${core}px`,
            '--fs-breathe-dur': `${breatheDur}s`,
            animationDelay: `${offset / 2}s`,
          }}
        />
      </span>
    </span>
  )
}

export const Firefly = memo(FireflyBase)

/**
 * 今天还空着的位置：一圈虚线微光。
 * 不用灰色或"未完成"的红点 —— 只是"位置留着"。
 */
export function FireflyPlaceholder({ date }) {
  const rng = makeRng(`ph-${date}`)
  const top = rngRange(rng, 22, 62)
  const left = 12 + Math.pow(rng(), 1.3) * 60
  return (
    <span className="ff ff--empty fs-breathe" style={{ top: `${top}%`, left: `${left}%` }}>
      <span className="ff__drift">
        <span className="ff__slot" />
      </span>
    </span>
  )
}
