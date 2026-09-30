import { REST_CARD_MAX, REST_CARD_MONTHLY, STREAK_MILESTONES } from '../constants'
import { addDays, diffDays, monthKey, recentKeys } from '../../lib/date'

/** 新建用户的连击初始状态：先送 1 张休憩卡，让用户一上手就有安全垫 */
export function initialStreak(today) {
  return {
    /** 当前连击（未含今天；今天的点亮通过 streakView 实时叠加） */
    current: 0,
    /** 历史最佳连击，永不因为中断而变少 */
    best: 0,
    /** 最近一次点亮的日子 */
    lastLitDate: null,
    /** 已经结算到哪一天（结算 = 决定这一天的结局） */
    lastSettledDate: null,
    /** 持有的休憩卡数量 */
    restCards: 1,
    /** 上次发放休憩卡的月份，形如 2026-09 */
    lastGrantMonth: monthKey(today),
    /** 休憩卡消耗记录 */
    restCardLog: [],
    /** 最近一次"萤火虫休息"发生在哪一天，以及当时连击有多长 */
    pausedAt: null,
    pausedLength: 0,
  }
}

/**
 * 逐日结算连击（幂等，可以随便多调几次）。
 *
 * 对 lastSettledDate 之后的每一天依次判定：
 *   1. 已点亮        -> 连击 +1
 *   2. 已被休憩卡保护 -> 连击 +1（补记，幂等）
 *   3. 未点亮但有休憩卡 -> 自动消耗 1 张，标记该天为"休憩"，连击 +1（仅护连击，不发当日奖励）
 *   4. 都没有         -> 连击暂停：把当前连击存进历史最佳，current 归零
 *
 * 注意第 4 条：不清除任何历史数据，best 与书架上的萤火虫全部保留。
 * 这是"绝不惩罚用户"的落地点 —— 中断只是萤火虫休息了一下。
 */
export function rolloverStreak(streak, days, today) {
  const next = { ...streak, restCardLog: [...(streak.restCardLog || [])] }
  const dayPatches = {}
  const events = []

  // ---- 首次结算：起点定在"最早有记录的那天"的前一天 ----
  // 不追究安装之前完全空白的日子，但已经存在的记录必须补算，否则历史会被漏掉。
  if (!next.lastSettledDate) {
    const keys = Object.keys(days || {}).sort()
    next.lastSettledDate = keys.length ? addDays(keys[0], -1) : addDays(today, -1)
  }

  let cursor = addDays(next.lastSettledDate, 1)
  let guard = 0
  while (diffDays(cursor, today) < 0 && guard < 4000) {
    const day = days[cursor]

    if (day && day.lit) {
      next.current += 1
      next.lastLitDate = cursor
      next.pausedAt = null
      next.pausedLength = 0
      events.push({ type: 'continue', date: cursor, current: next.current })
    } else if (day && day.rested) {
      // 已经保护过，幂等跳过
      next.current += 1
      next.lastLitDate = cursor
    } else if (next.restCards > 0) {
      next.restCards -= 1
      next.restCardLog.push({ date: cursor, month: monthKey(cursor) })
      dayPatches[cursor] = { rested: true, restedBy: 'card' }
      next.current += 1
      next.lastLitDate = cursor
      next.pausedAt = null
      next.pausedLength = 0
      events.push({ type: 'card-used', date: cursor, cards: next.restCards, current: next.current })
    } else if (next.current > 0) {
      // 萤火虫休息了一下：连击从零开始数，但历史最佳与所有记录都留着
      next.best = Math.max(next.best, next.current)
      next.pausedAt = cursor
      next.pausedLength = next.current
      next.current = 0
      events.push({ type: 'paused', date: cursor, lost: next.pausedLength })
    }

    next.lastSettledDate = cursor
    cursor = addDays(cursor, 1)
    guard += 1
  }

  // 历史最佳随时刷新：连击一直在延续时也要跟上，不然 best 会一直是 0
  next.best = Math.max(next.best, next.current)

  // ---- 每月自动发放休憩卡 ----
  // 放在结算之后：新月份的卡只往后生效，不会回头去护上个月最后一天。
  const mk = monthKey(today)
  if (next.lastGrantMonth !== mk) {
    next.lastGrantMonth = mk
    if (next.restCards < REST_CARD_MAX) {
      next.restCards = Math.min(REST_CARD_MAX, next.restCards + REST_CARD_MONTHLY)
      events.push({ type: 'card-grant', month: mk, cards: next.restCards })
    }
  }

  return { streak: next, dayPatches, events }
}

/**
 * 全量重放连击（数据修正后调用）。
 * 已经标记为"休憩"的日子保持原样重放，所以不会重复消耗休憩卡；
 * best 从原状态继承，保证"历史最佳永不减少"。
 */
export function rebuildStreak(state, today) {
  const keys = Object.keys(state.days || {}).sort()
  const base = {
    ...initialStreak(today),
    best: state.streak.best,
    restCards: state.streak.restCards,
    lastGrantMonth: state.streak.lastGrantMonth,
    restCardLog: [...(state.streak.restCardLog || [])],
    lastSettledDate: keys.length ? addDays(keys[0], -1) : addDays(today, -1),
  }
  const { streak } = rolloverStreak(base, state.days, today)
  return { streak }
}

/** 某天的展示状态（不出现"失败"这类字眼） */
export function dayStatus(day, date, today) {
  if (day && day.lit) return 'lit'
  if (day && day.rested) return 'rest'
  const delta = diffDays(date, today)
  if (delta > 0) return 'future'
  if (delta === 0) return day && day.totalSec > 0 ? 'progress' : 'today'
  return 'quiet'
}

/**
 * 连击的可视化视图。
 * current 实时叠加今天：今天点亮后，连击立刻 +1，不用等到明天。
 */
export function streakView(streak, days, today) {
  const todayDay = days[today]
  const todayLit = !!(todayDay && todayDay.lit)
  const todayRested = !!(todayDay && todayDay.rested)
  const current = streak.current + (todayLit || todayRested ? 1 : 0)
  const best = Math.max(streak.best, current)
  const history = Object.keys(days)

  const recent = recentKeys(today, 7).map((date) => ({
    date,
    status: dayStatus(days[date], date, today),
    totalSec: (days[date] && days[date].totalSec) || 0,
  }))

  const nextMilestone = STREAK_MILESTONES.find((m) => m > current) || null
  const reached = STREAK_MILESTONES.filter((m) => m <= best)

  return {
    current,
    best,
    recent,
    todayLit,
    nextMilestone,
    reached,
    restCards: streak.restCards,
    /** 最近一次"萤火虫休息"是否就发生在刚过去的那几天（用于温柔提示） */
    paused: !!streak.pausedAt,
    pausedAt: streak.pausedAt,
    pausedLength: streak.pausedLength,
    litDays: history.filter((d) => days[d] && days[d].lit).length,
    /** 连续阅读的最长记录（含被休憩卡保护的日子） */
    longestSpan: streak.best,
  }
}
