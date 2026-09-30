import React, { useMemo, useState } from 'react'
import { Toast } from 'antd-mobile'
import { useApp } from '../../store/store'
import { StudyScene } from '../../components/scene/StudyScene'
import { DayDots } from '../../components/ui/DayDots'
import { DayDetailSheet } from '../../components/DayDetailSheet'
import { Icon } from '../../components/icons/Icons'
import { STREAK_MILESTONES, TREE_STAGES } from '../../store/constants'
import { roomLight } from '../../store/selectors'
import { addDays, diffDays } from '../../lib/date'
import { formatDuration, formatDurationTight, formatMinutes, greeting } from '../../lib/format'
import './study.css'

/**
 * 书房（首页）。
 * 一屏看全：今天的书房亮不亮、连击到几、光合树长到哪、今天的萤火虫。
 */
export function StudyPage({ onOpenSettings, onOpenShop, onStartReading }) {
  const { state, derived, actions } = useApp()
  const { stats, streak, tree, level, today, restCards } = derived
  const [detailDate, setDetailDate] = useState(null)

  const todayDay = state.days[today]
  const todaySec = todayDay ? todayDay.totalSec : 0
  const todayLit = !!(todayDay && todayDay.lit)
  const todaySessions = useMemo(
    () => (state.sessions || []).filter((s) => s.date === today),
    [state.sessions, today]
  )

  /** 书架上要看得到的萤火虫：所有点亮过的日子 */
  const fireflies = useMemo(
    () =>
      Object.values(state.days)
        .filter((d) => d.lit)
        .map((d) => ({ date: d.date, totalSec: d.totalSec })),
    [state.days]
  )

  const light = roomLight(stats.totalSec)
  const secondsToLight = Math.max(0, 300 - todaySec)

  const nextMilestone = streak.nextMilestone
  const milestoneHint = nextMilestone
    ? `再连 ${nextMilestone - streak.current} 天，就到 ${nextMilestone} 天`
    : '连击里程碑都点亮了，继续就好'

  return (
    <div className="fs-page study">
      <header className="fs-topbar">
        <div className="fs-grow">
          <h1 className="fs-topbar__title">{greeting()}</h1>
          <p className="fs-topbar__sub">
            {stats.litDays ? `书房已经亮了 ${stats.litDays} 天` : '书架还暗着，等你点第一只萤火虫'}
          </p>
        </div>
        <button type="button" className="study__points" onClick={onOpenShop} aria-label="打开光点商店">
          <Icon name="coin" size={15} />
          <span className="fs-num">{state.points.balance}</span>
        </button>
        <button
          type="button"
          className="fs-iconbtn study__settings"
          onClick={onOpenSettings}
          aria-label="设置"
        >
          <Icon name="settings" size={19} />
        </button>
      </header>

      {/* 场景和它的说明文字算一个区块，这样说明紧贴场景、整块再和下一张卡保持统一间距 */}
      <div className="study__scene">
        <StudyScene
          fireflies={fireflies}
          books={state.books}
          light={light}
          treeStage={tree.stage}
          treeSleeping={tree.sleeping}
          todayLit={todayLit}
          todayKey={today}
          theme={state.cosmetic.theme}
          reduceMotion={state.settings.reduceMotion}
          onPickFirefly={setDetailDate}
        />

        <div className="study__caption">
          <span className="fs-tiny fs-muted">
            {fireflies.length} 只萤火虫 · 房间亮度 {Math.round(light * 100)}%
          </span>
          <span className="fs-tiny fs-muted">{formatDurationTight(stats.totalSec)} 累计</span>
        </div>
      </div>

      {/* ---- 今天 ---- */}
      <section className="fs-card fs-card--glow study__today">
        <div className="fs-row fs-between">
          <div>
            <div className="fs-small fs-muted-2">今天</div>
            <div className="study__today-sec fs-display">
              {todaySec > 0 ? formatDuration(todaySec) : '还没开始'}
            </div>
          </div>
          <div className="study__today-state">
            {todayLit ? (
              <span className="fs-chip fs-chip--accent">
                <Icon name="firefly" size={13} />
                已点亮
              </span>
            ) : (
              <span className="fs-chip">还差 {formatMinutes(secondsToLight)}点亮</span>
            )}
            {todayDay && todayDay.pointsEarned ? (
              <span className="fs-chip">今天 +{todayDay.pointsEarned} 光点</span>
            ) : null}
          </div>
        </div>

        <button type="button" className="fs-btn fs-btn--primary study__cta" onClick={onStartReading}>
          <Icon name="play" size={19} />
          开始阅读
        </button>
        <p className="study__cta-hint fs-tiny fs-muted">读满 5 分钟就点亮一只萤火虫，门槛很低，先赢起来</p>
      </section>

      {/* ---- 萤火连击 ---- */}
      <section className="fs-card study__streak">
        <div className="fs-row fs-between" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="fs-card__title" style={{ marginBottom: 4 }}>
              <Icon name="flame" size={16} />
              萤火连击
            </div>
            <div className="study__streak-num">
              <span className="fs-display fs-num">{streak.current}</span>
              <span className="study__streak-unit">天</span>
            </div>
          </div>
          <div className="study__streak-right">
            <div className="fs-tiny fs-muted">历史最佳</div>
            <div className="fs-num fs-muted-2">{streak.best} 天</div>
          </div>
        </div>

        {/* 卡片内部的间距，和页面级节奏无关 */}
        <div className="study__dots">
          <DayDots days={streak.recent} onPick={setDetailDate} />
        </div>

        <div className="study__milestones">
          {STREAK_MILESTONES.map((m) => (
            <span
              key={m}
              className={`study__milestone ${streak.best >= m ? 'is-on' : ''}`}
              title={streak.best >= m ? `已达成 ${m} 天` : `${m} 天里程碑`}
            >
              {streak.best >= m ? <Icon name="check" size={11} /> : null}
              {m} 天
            </span>
          ))}
          <span className="fs-chip" title="休憩卡：每月自动发 1 张，漏读时自动护住连击">
            <Icon name="card" size={13} />
            休憩卡 {restCards}
          </span>
        </div>

        <p className="study__streak-note">
          {streak.paused
            ? '萤火虫们休息了一下，继续点亮就能接上连击。历史记录都还在。'
            : milestoneHint}
        </p>
      </section>

      {/* ---- 光合树 ---- */}
      <section className="fs-card study__tree">
        <div className="fs-card__title" style={{ marginBottom: 8 }}>
          <Icon name="tree" size={16} />
          光合树
          <span className="fs-muted fs-tiny">第 {tree.stage + 1} / {TREE_STAGES.length} 阶</span>
        </div>
        <div className="fs-row" style={{ gap: 'var(--fs-s4)', alignItems: 'flex-start' }}>
          <div className="study__tree-name">
            <div className="study__tree-title">{tree.name}</div>
            <div className="fs-tiny fs-muted">{tree.sleeping ? '睡着了，回来读一会儿就醒' : tree.hint}</div>
          </div>
          <div className="study__tree-meter">
            <div className="fs-tiny fs-muted fs-between fs-row">
              <span>{formatDurationTight(stats.totalSec)}</span>
              <span>{tree.maxed ? '已满阶' : `下一阶 ${tree.nextName}`}</span>
            </div>
            <div className="pbar" style={{ marginTop: 6 }}>
              <div className="pbar__fill" style={{ width: `${Math.round(tree.progress * 100)}%` }} />
            </div>
            <div className="fs-tiny fs-muted" style={{ marginTop: 6 }}>
              {tree.maxed
                ? '整棵树都亮起来了'
                : `再读 ${formatDuration(tree.secToNextStage)} 就长一阶（只随累计总量成长，不会退化）`}
            </div>
          </div>
        </div>
      </section>

      {/* ---- 今天读过的 ---- */}
      {todaySessions.length ? (
        <section className="fs-card study__records">
          <div className="fs-card__title">
            <Icon name="Note" size={16} />
            今天读过的
            <span className="fs-muted fs-tiny">{todaySessions.length} 次</span>
          </div>
          {todaySessions.map((s) => {
            const book = state.books.find((b) => b.id === s.bookId)
            return (
              <div className="row" key={s.id}>
                <div className="row__glyph">
                  <Icon name="book" size={17} />
                </div>
                <div className="row__main">
                  <div className="row__title fs-ellipsis">{book ? book.title : '未指定书目'}</div>
                  <div className="row__sub">
                    {formatDuration(s.durationSec)}
                    {s.note ? ` · ${s.note}` : ''}
                  </div>
                </div>
                <span className="row__value">{s.pointsEarned ? `+${s.pointsEarned}` : ''}</span>
              </div>
            )
          })}
          <button
            type="button"
            className="fs-btn fs-btn--ghost fs-btn--sm fs-btn--block"
            style={{ marginTop: 'var(--fs-s3)' }}
            onClick={() => setDetailDate(today)}
          >
            查看今天的完整记录
          </button>
        </section>
      ) : null}

      {/* ---- 等级进度 ---- */}
      <section className="fs-card study__level">
        <div className="fs-row fs-between">
          <div className="fs-row" style={{ gap: 6 }}>
            <Icon name={level.level.glyph === 'moon' ? 'moon' : level.level.glyph === 'lamp' ? 'lamp' : 'spark'} size={16} />
            <span className="fs-card__title" style={{ margin: 0 }}>
              {level.level.name}
            </span>
          </div>
          <span className="fs-tiny fs-muted">{formatDurationTight(stats.totalSec)} · {stats.litDays} 次点亮</span>
        </div>
        <p className="fs-tiny fs-muted" style={{ margin: '4px 0 10px' }}>
          {level.level.desc}
        </p>
        <div className="pbar">
          <div className="pbar__fill" style={{ width: `${Math.round(level.progress * 100)}%` }} />
        </div>
        <div className="fs-tiny fs-muted fs-row fs-between" style={{ marginTop: 6 }}>
          <span>{state.points.totalEarned} 光点</span>
          <span>
            {level.next ? `再 ${level.toNext} 光点升到 ${level.next.name}` : '已经是最高等级'}
          </span>
        </div>
      </section>


      {detailDate ? <DayDetailSheet date={detailDate} onClose={() => setDetailDate(null)} /> : null}
    </div>
  )
}
