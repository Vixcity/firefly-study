import React, { useMemo } from 'react'
import { BADGE_MAP } from '../store/catalog'
import { Icon } from './icons/Icons'
import { formatDuration } from '../lib/format'
import { makeRng, rngRange } from '../lib/rand'
import './reward.css'

const PARTICLES = (() => {
  const rng = makeRng('reward-particles')
  return Array.from({ length: 16 }, () => ({
    px: rngRange(rng, -70, 70),
    left: rngRange(rng, 12, 88),
    top: rngRange(rng, 22, 62),
    delay: rngRange(rng, 0, 0.5),
    size: rngRange(rng, 3, 6),
  }))
})()

/**
 * 点亮时刻的仪式感。
 * 一次把结果全说清楚：读了多少、点亮了、拿到多少光点、是否长高了、连击到几。
 * 全部是正向反馈，一个"但是"都不会有。
 */
export function RewardOverlay({ result, onClose, onViewFirefly, reduceMotion = false }) {
  const particles = useMemo(() => (reduceMotion ? [] : PARTICLES), [reduceMotion])
  if (!result) return null

  const {
    durationSec,
    newlyLit,
    dayLit,
    pointsGained,
    breakdown,
    newBadges,
    treeGrew,
    treeAfter,
    streak,
    finishedBookIds,
    cappedAway,
  } = result

  return (
    <div className="reward" role="dialog" aria-modal="true">
      <div className="reward__bg" />

      {/* 从中心扩散的光环 */}
      {!reduceMotion ? (
        <>
          <span className="reward__ripple" style={{ animationDelay: '0ms' }} />
          <span className="reward__ripple" style={{ animationDelay: '220ms' }} />
          <span className="reward__ripple" style={{ animationDelay: '440ms' }} />
        </>
      ) : null}

      {/* 飞向书架的萤火虫 */}
      <span className={`reward__flyer ${reduceMotion ? '' : 'fs-breathe'}`} />

      {/* 粒子光效 */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="reward__particle fs-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            '--px': `${p.px}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="reward__body fs-soft-in">
        <div className={`reward__badge ${reduceMotion ? '' : 'fs-pop-in'}`}>
          <Icon name="firefly" size={46} strokeWidth={1.4} />
        </div>

        <h2 className="reward__title">
          {newlyLit ? '点亮了一只萤火虫' : dayLit ? '萤火虫又亮了一点' : '读完了这一会儿'}
        </h2>
        <p className="reward__sub">
          {newlyLit
            ? '书房比昨天更亮了一点点'
            : dayLit
              ? '今天的萤火虫已经亮了，你还在继续'
              : `再读 ${Math.max(1, Math.ceil((300 - (durationSec || 0)) / 60))} 分钟就能点亮今天的萤火虫`}
        </p>

        <div className="reward__stats">
          <RewardStat label="本次阅读" value={formatDuration(durationSec)} />
          <RewardStat label="光点" value={`+${pointsGained}`} accent />
          <RewardStat label="萤火连击" value={`${streak ? streak.current : 0} 天`} />
        </div>

        {/* 明细：让"为什么拿到这些光点"一眼可见 */}
        {pointsGained > 0 ? (
          <div className="reward__detail">
            {breakdown.lit ? <span className="fs-chip fs-chip--accent">点亮 +{breakdown.lit}</span> : null}
            {breakdown.time ? <span className="fs-chip">时长 +{breakdown.time}</span> : null}
            {breakdown.book ? <span className="fs-chip fs-chip--ok">读完一本书 +{breakdown.book}</span> : null}
            {cappedAway > 0 ? (
              <span className="fs-chip">今天的光点已经收满，明天继续</span>
            ) : null}
          </div>
        ) : (
          <div className="reward__detail">
            <span className="fs-chip">今天的光点已经收满了，休息也很好</span>
          </div>
        )}

        {treeGrew ? (
          <div className="reward__toast">
            <Icon name="tree" size={16} />
            光合树长高了一阶（第 {treeAfter + 1} 阶）
          </div>
        ) : null}

        {finishedBookIds && finishedBookIds.length ? (
          <div className="reward__toast">
            <Icon name="bookcheck" size={16} />
            又读完了一本书
          </div>
        ) : null}

        {newBadges && newBadges.length ? (
          <div className="reward__badges">
            <div className="fs-tiny fs-muted">新徽章</div>
            <div className="fs-row fs-wrap" style={{ gap: 6, marginTop: 6 }}>
              {newBadges.map((id) => (
                <span key={id} className="fs-chip fs-chip--accent">
                  <Icon name={(BADGE_MAP[id] && BADGE_MAP[id].glyph) || 'medal'} size={13} />
                  {BADGE_MAP[id] ? BADGE_MAP[id].name : id}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="reward__actions">
          <button type="button" className="fs-btn fs-btn--primary" onClick={onClose}>
            回到书房
          </button>
          {newlyLit && onViewFirefly ? (
            <button type="button" className="fs-btn fs-btn--ghost" onClick={onViewFirefly}>
              看看今天的萤火虫
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function RewardStat({ label, value, accent }) {
  return (
    <div className="reward__stat">
      <div className="reward__stat-label">{label}</div>
      <div className={`reward__stat-value fs-display ${accent ? 'fs-warm' : ''}`}>{value}</div>
    </div>
  )
}
