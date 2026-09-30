import React, { useEffect, useState } from 'react'
import { useApp } from '../../store/store'
import { Sheet } from '../../components/ui/Sheet'
import { Ring } from '../../components/ui/Ring'
import { Icon } from '../../components/icons/Icons'
import { BADGE_GROUPS } from '../../store/catalog'
import { LEVELS } from '../../store/constants'
import { badgeProgress } from '../../store/rules/badges'
import { badgeWall } from '../../store/rules/badges'
import { formatDuration, formatDateTime } from '../../lib/format'
import './badges.css'

/** 荣光：等级 + 徽章墙 */
export function BadgesPage() {
  const { state, derived, actions } = useApp()
  const { level, stats } = derived
  const [detail, setDetail] = useState(null)

  // 进这一页就算"看过了"，底部导航的小点会消失
  useEffect(() => {
    const seen = state.badges.seenAt || 0
    const hasNew = Object.values(state.badges.unlocked || {}).some((at) => at > seen)
    if (hasNew) actions.markBadgesSeen()
  }, [state.badges, actions])

  const wall = badgeWall(state.badges.unlocked, stats)
  const [group, setGroup] = useState('all')

  const inGroup = (list) => (group === 'all' ? list : list.filter((b) => b.group === group))

  const levelIndex = level.index + 1

  return (
    <div className="fs-page badges">
      <header className="fs-topbar">
        <div className="fs-grow">
          <h1 className="fs-topbar__title">荣光</h1>
          <p className="fs-topbar__sub">
            已经收集 {wall.gotCount} / {wall.total} 枚徽章
          </p>
        </div>
      </header>

      {/* ---- 等级 ---- */}
      <section className="fs-card fs-card--glow badges__level">
        <div className="fs-row" style={{ gap: 'var(--fs-s5)' }}>
          <Ring size={96} stroke={7} progress={level.progress}>
            <div className="badges__level-glyph">
              <Icon
                name={level.level.glyph === 'moon' ? 'moon' : level.level.glyph === 'lamp' ? 'lamp' : 'spark'}
                size={26}
              />
            </div>
          </Ring>
          <div className="fs-grow">
            <div className="fs-tiny fs-muted">
              第 {levelIndex} / {LEVELS.length} 阶
            </div>
            <div className="badges__level-name">{level.level.name}</div>
            <div className="fs-tiny fs-muted" style={{ lineHeight: 1.7 }}>
              {level.level.desc}
            </div>
            <div className="fs-tiny fs-muted-2" style={{ marginTop: 6 }}>
              累计 {state.points.totalEarned} 光点
              {level.next ? ` · 再 ${level.toNext} 升到 ${level.next.name}` : ' · 已到最高等级'}
            </div>
          </div>
        </div>

        <div className="badges__levels">
          {LEVELS.map((l, i) => (
            <span key={l.id} className={`badges__lvl ${i <= level.index ? 'is-on' : ''}`} title={l.desc}>
              {l.name}
            </span>
          ))}
        </div>
      </section>

      {/* ---- 概览 ---- */}
      <div className="fs-grid2" style={{ marginTop: 'var(--fs-s4)' }}>
        <div className="stat">
          <div className="stat__label">
            <Icon name="firefly" size={11} />
            点亮天数
          </div>
          <div className="stat__value fs-display">
            {stats.litDays}
            <span className="stat__unit">天</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icon name="timer" size={11} />
            累计阅读
          </div>
          <div className="stat__value fs-display">{Math.round(stats.totalSec / 3600)}</div>
          <div className="stat__sub">小时 · {formatDuration(stats.totalSec)}</div>
        </div>
      </div>

      {/* ---- 分类 ---- */}
      <div className="badges__groups">
        <button
          type="button"
          className={`badges__group ${group === 'all' ? 'is-on' : ''}`}
          onClick={() => setGroup('all')}
        >
          全部
        </button>
        {BADGE_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            className={`badges__group ${group === g ? 'is-on' : ''}`}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ---- 已获得 ---- */}
      {inGroup(wall.got).length ? (
        <section className="fs-section">
          <div className="fs-section__head">
            <h2>已经点亮</h2>
            <span className="fs-tiny fs-muted">{wall.gotCount} 枚</span>
          </div>
          <div className="fs-grid3">
            {inGroup(wall.got).map((b) => (
              <button key={b.id} type="button" className="badge is-got" onClick={() => setDetail(b)}>
                <span className="badge__medal">
                  <span className="badge__ring" />
                  <Icon name={b.glyph} size={26} strokeWidth={1.5} />
                </span>
                <span className="badge__name">{b.name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---- 未获得 ---- */}
      <section className="fs-section">
        <div className="fs-section__head">
          <h2>{inGroup(wall.got).length ? '快集齐了' : '徽章在这里等你'}</h2>
          <span className="fs-tiny fs-muted">{wall.locked.length} 枚未解锁</span>
        </div>
        {inGroup(wall.locked).length === 0 ? (
          <div className="fs-empty">这一类都拿到手了。</div>
        ) : (
          <div className="fs-grid3">
            {inGroup(wall.locked).map((b) => (
              <button key={b.id} type="button" className="badge" onClick={() => setDetail(b)}>
                <span className="badge__medal">
                  <Icon name={b.glyph} size={26} strokeWidth={1.5} />
                  <span className="badge__progress" style={{ width: `${Math.round(b.ratio * 100)}%` }} />
                </span>
                <span className="badge__name">{b.name}</span>
                {/* 解锁条件 + 还差多少：让"没拿到"看起来是"快到了" */}
                <span className="badge__cond">{b.text}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="fs-safe-bottom" />

      <Sheet visible={!!detail} onClose={() => setDetail(null)}>
        {detail ? <BadgeDetail badge={detail} stats={stats} unlockedAt={state.badges.unlocked[detail.id]} /> : null}
      </Sheet>
    </div>
  )
}

function BadgeDetail({ badge, stats, unlockedAt }) {
  const progress = unlockedAt ? null : badgeProgress(badge.id, stats)
  return (
    <div className="badgedetail">
      <div className={`badge is-got badgedetail__medal`}>
        <span className="badge__medal">
          <span className="badge__ring" />
          <Icon name={badge.glyph} size={40} strokeWidth={1.4} />
        </span>
      </div>
      <h3 className="fs-center" style={{ margin: '10px 0 4px', fontSize: 'var(--fs-fz-lg)' }}>
        {badge.name}
      </h3>
      <p className="fs-center fs-small fs-muted" style={{ margin: 0 }}>
        {badge.desc}
      </p>

      {unlockedAt ? (
        <div className="badgedetail__got">
          <Icon name="check" size={15} />
          {formatDateTime(unlockedAt)} 获得
        </div>
      ) : (
        <>
          <div className="pbar" style={{ marginTop: 'var(--fs-s5)' }}>
            <div className="pbar__fill" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
          </div>
          <p className="fs-center fs-tiny fs-muted" style={{ marginTop: 8 }}>
            {progress.text}
          </p>
        </>
      )}
    </div>
  )
}
