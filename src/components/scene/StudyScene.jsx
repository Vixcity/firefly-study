import React, { memo, useMemo } from 'react'
import { Firefly, FireflyPlaceholder } from './Firefly'
import { PhotoTree } from './PhotoTree'
import { makeRng, rngRange } from '../../lib/rand'
import { seedOf } from '../../lib/id'
import './scene.css'

/** 动画萤火虫的上限：再多就只留静态微光，保证低端机也稳 */
const ANIMATED_LIMIT = 26

/** 尘埃：固定 9 粒，营造"空气里有光"的感觉 */
const DUST = Array.from({ length: 9 }, (_, i) => {
  const rng = makeRng(`dust-${i}`)
  return {
    top: rngRange(rng, 6, 88),
    left: rngRange(rng, 4, 96),
    size: rngRange(rng, 1.4, 3),
    dur: rngRange(rng, 4, 9),
    delay: -rngRange(rng, 0, 6),
  }
})

/** 书脊配色：由书名种子决定，同一本书永远同一个颜色 */
function spineStyle(title, seed) {
  const h = seed % 360
  const s = 24 + ((seed >> 8) % 18)
  const l = 34 + ((seed >> 16) % 16)
  const h2 = (h + 18) % 360
  return {
    background: `linear-gradient(180deg, hsl(${h} ${s}% ${l + 6}%) 0%, hsl(${h2} ${s}% ${l - 4}%) 100%)`,
    borderTop: '1px solid rgba(255,255,255,0.14)',
  }
}

function BookshelfBase({ books }) {
  const rows = useMemo(() => {
    const list = (books || []).slice(0, 12)
    const per = Math.max(2, Math.ceil(list.length / 3))
    const out = [[], [], []]
    list.forEach((b, i) => out[Math.min(2, Math.floor(i / per))].push(b))
    return out
  }, [books])

  return (
    <div className="shelf" aria-hidden="true">
      {rows.map((rowBooks, row) => (
        <div className="shelf__row" key={row}>
          <div className="shelf__books">
            {/* 装饰书脊：书架不该空着（宽度必须给，否则 flex 里会被压成 0） */}
            <span
              className="spine spine--deco"
              style={{ height: '46%', width: '9px', ...spineStyle('', seedOf(`deco-${row}-a`)) }}
            />
            {rowBooks.map((b) => {
              const seed = seedOf(b.title)
              const rng = makeRng(`spine-${b.id}`)
              const height = rngRange(rng, 56, 88)
              const width = rngRange(rng, 7, 13)
              return (
                <span
                  key={b.id}
                  className={`spine ${b.status === 'finished' ? 'spine--done' : ''}`}
                  style={{
                    height: `${height}%`,
                    width: `${width}px`,
                    ...spineStyle(b.title, seed),
                    transform: `rotate(${rngRange(rng, -1.4, 1.4).toFixed(2)}deg)`,
                  }}
                  title={b.title}
                >
                  <span className="spine__text">{b.title}</span>
                </span>
              )
            })}
            <span
              className="spine spine--deco"
              style={{ height: '62%', width: '11px', ...spineStyle('', seedOf(`deco-${row}-b`)) }}
            />
          </div>
          <div className="shelf__board" />
        </div>
      ))}
    </div>
  )
}

const Bookshelf = memo(BookshelfBase)

function StudySceneBase({
  fireflies = [],
  books = [],
  light = 0.18,
  treeStage = 0,
  treeSleeping = false,
  todayLit = false,
  todayKey,
  onPickFirefly,
  theme = 'theme_ink',
  reduceMotion = false,
}) {
  // 最近的若干只做动画，更早的只留静态微光
  const ordered = useMemo(
    () => [...fireflies].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [fireflies]
  )
  const animated = useMemo(
    () => (reduceMotion ? [] : ordered.slice(0, ANIMATED_LIMIT)),
    [ordered, reduceMotion]
  )
  const still = useMemo(
    () => (reduceMotion ? ordered : ordered.slice(ANIMATED_LIMIT)),
    [ordered, reduceMotion]
  )
  const canPick = typeof onPickFirefly === 'function'

  /**
   * 萤火虫多了以后，每只要更小更淡 —— 否则满屏都是硬光球，书房就变成星空了。
   * 数量带来的效果应该是"房间更亮"，而不是"点更多"。
   */
  const density = ordered.length
  const flySize = density > 30 ? 5.5 : density > 18 ? 6.5 : density > 8 ? 8 : 9.5
  const flyOpacity = Math.max(0.4, Math.min(1, 1.1 - density * 0.02))
  const mist = Math.min(0.5, density * 0.013)

  return (
    <div
      className="scene"
      style={{
        '--room-light': light,
        '--room-light-dim': light * 0.55,
        '--ff-opacity': flyOpacity,
        '--ff-mist': mist,
      }}
      data-theme-scene={theme}
    >
      {/* L1 背景：墙面与夜色 */}
      <div className="scene__wall" />
      {theme === 'theme_starry' ? <div className="scene__aurora" /> : null}
      {theme === 'theme_rain' ? <div className="scene__rain" /> : null}
      {theme === 'theme_forest' ? <div className="scene__vines" /> : null}

      {/* L2 房间亮度：读得越多越亮 */}
      <div className="scene__glow" />
      <div className="scene__mist" />
      <div className="scene__floorline" />

      {/* L3 书架 */}
      <Bookshelf books={books} />

      {/* L4 窗台 + 光合树 */}
      <div className="window">
        <div className="window__sky" />
        <div className="window__moon" />
        <div className="window__mullion" />
        <div className="window__beam" />
        <div className="window__sill">
          <PhotoTree stage={treeStage} sleeping={treeSleeping} className="window__tree" />
        </div>
      </div>

      {/* L5 萤火虫 */}
      <div className="scene__fireflies">
        {still.map((f) => (
          <Firefly key={f.date} date={f.date} size={flySize - 1.5} still />
        ))}
        {animated.map((f) => (
          <Firefly
            key={`a-${f.date}`}
            date={f.date}
            size={flySize}
            isToday={f.date === todayKey}
            drift={f.date === todayKey ? 'a' : 'b'}
          />
        ))}
        {!todayLit && todayKey ? <FireflyPlaceholder date={todayKey} /> : null}
      </div>

      {/* 可点区域：单独一层按钮，避免动画层被点击打断 */}
      {canPick ? (
        <div className="scene__picks">
          {ordered.map((f) => (
            <PickButton key={f.date} item={f} onPick={onPickFirefly} />
          ))}
        </div>
      ) : null}

      {/* L6 压暗与暖光收边 */}
      <div className="scene__vignette" />
      <div className="scene__dust" aria-hidden="true">
        {DUST.map((d, i) => (
          <span
            key={i}
            className={reduceMotion ? '' : 'fs-twinkle'}
            style={{
              top: `${d.top}%`,
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              '--fs-twinkle-dur': `${d.dur}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** 萤火虫的点击热区：透明按钮，位置与萤火虫一致 */
function PickButton({ item, onPick }) {
  const rng = makeRng(`ff-${item.date}`)
  const top = rngRange(rng, 10, 74)
  const left = rngRange(rng, 5, 92)
  return (
    <button
      type="button"
      className="ff__pick"
      style={{ top: `${top}%`, left: `${left}%` }}
      onClick={() => onPick && onPick(item.date)}
      aria-label={`查看 ${item.date} 的阅读记录`}
    />
  )
}

export const StudyScene = memo(StudySceneBase)
