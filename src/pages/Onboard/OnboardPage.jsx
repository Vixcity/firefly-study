import React from 'react'
import { FireflyMark, Icon } from '../../components/icons/Icons'
import { makeRng, rngRange } from '../../lib/rand'
import './onboard.css'

const FLIES = Array.from({ length: 7 }, (_, i) => {
  const rng = makeRng(`onboard-${i}`)
  return {
    top: rngRange(rng, 8, 46),
    left: rngRange(rng, 6, 90),
    size: rngRange(rng, 5, 9),
    dur: rngRange(rng, 16, 26),
    breathe: rngRange(rng, 2.6, 4.4),
  }
})

/** 首次进入的一屏引导：只讲三件事，然后就开始 */
export function OnboardPage({ onDone, onStart }) {
  return (
    <div className="onboard">
      <div className="onboard__glow" />
      <div className="onboard__flies" aria-hidden="true">
        {FLIES.map((f, i) => (
          <span key={i} className="onboard__fly" style={{ top: `${f.top}%`, left: `${f.left}%` }}>
            <span
              className="fs-drift-a"
              style={{ '--fs-drift-dur': `${f.dur}s`, animationDelay: `${-i * 1.7}s` }}
            >
              <span
                className="onboard__core fs-breathe"
                style={{
                  width: `${f.size}px`,
                  height: `${f.size}px`,
                  '--fs-breathe-dur': `${f.breathe}s`,
                  animationDelay: `${-i}s`,
                }}
              />
            </span>
          </span>
        ))}
      </div>

      <div className="onboard__body">
        <FireflyMark size={78} className={undefined} />
        <h1 className="onboard__title">萤火书房</h1>
        <p className="onboard__slogan">点亮一只萤火虫，书房就亮一点</p>

        <ul className="onboard__list">
          <li>
            <span className="onboard__icon">
              <Icon name="firefly" size={18} />
            </span>
            <div>
              <b>读满 5 分钟就点亮</b>
              <span>门槛很低，先让今天的萤火虫亮起来。</span>
            </div>
          </li>
          <li>
            <span className="onboard__icon">
              <Icon name="tree" size={18} />
            </span>
            <div>
              <b>光合树只长不落</b>
              <span>随累计阅读时长生长，久没来也只是睡着。</span>
            </div>
          </li>
          <li>
            <span className="onboard__icon">
              <Icon name="shield" size={18} />
            </span>
            <div>
              <b>漏读不扣分，连击不清零</b>
              <span>休憩卡会帮你护住连击，历史记录一直都在。</span>
            </div>
          </li>
        </ul>

        <button type="button" className="fs-btn fs-btn--primary onboard__cta" onClick={onDone}>
          <Icon name="play" size={18} />
          开始阅读
        </button>
        <button type="button" className="fs-btn fs-btn--ghost onboard__sub" onClick={() => onStart(true)}>
          先加一本想读的书
        </button>
        <p className="onboard__foot fs-tiny">
          数据只保存在这台设备上，随时可以导出备份。
        </p>
      </div>
    </div>
  )
}
